'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { fetchApi } from '@/lib/api';
import { getLanguageName } from '@/lib/languages';
import { sendGAEvent } from '@next/third-parties/google';
import { BookOpen, Plus, Loader2, Brain, List, Sparkles, Search, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight, Save, Rocket, BarChart3, FileUp, Globe, Languages, Layers } from 'lucide-react';
import { AIWordInfoCard } from '@/components/AIWordInfoCard';
import { BuyMeACoffee } from '@/components/BuyMeACoffee';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useTranslation } from '@/components/I18nContext';

const proficiencyLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const topicList = [
  { slug: "identity", title: "Identity & Personal Info" },
  { slug: "family", title: "Family & Relationships" },
  { slug: "home", title: "Home & Daily Life" },
  { slug: "food", title: "Food & Drinks" },
  { slug: "shopping", title: "Shopping & Money" },
  { slug: "health", title: "Health & Body" },
  { slug: "education", title: "Education & Learning" },
  { slug: "work", title: "Work & Career" },
  { slug: "leisure", title: "Leisure & Sports" },
  { slug: "travel", title: "Travel & Transport" },
  { slug: "city", title: "City & Infrastructure" },
  { slug: "nature", title: "Nature & Environment" },
  { slug: "technology", title: "Technology & Media" },
  { slug: "art", title: "Art, Culture & Ideas" },
];

interface GeneratedWord {
  source_word: string;
  target_word: string;
  comment: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [addingWord, setAddingWord] = useState(false);
  const [userLangs, setUserLangs] = useState({ source: '', target: '' });
  
  const [newWord, setNewWord] = useState({ source_word: '', target_word: '', comment: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  // AI Word List states
  const [selectedLevel, setSelectedLevel] = useState('B1');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [userTopic, setUserTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWords, setGeneratedWords] = useState<GeneratedWord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editWord, setEditWord] = useState<GeneratedWord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: '', description: '' });
  const [batchMessage, setBatchMessage] = useState({ type: '', text: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [newGeneratedWord, setNewGeneratedWord] = useState({ source_word: '', target_word: '', comment: '' });
  const [isTranslatingNewGenerated, setIsTranslatingNewGenerated] = useState(false);
  const [isTranslatingManual, setIsTranslatingManual] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [duplicateWords, setDuplicateWords] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ new: 0, learning: 0, review: 0, relearning: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const wordsPerPage = 30;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    fetchApi('/words/GetMe')
      .then(data => {
        if (!isMounted) return;
        const langData = data?.langCodeResp || data?.LangCodeResp;
        if (langData) {
          setUserLangs(langData);
          
          // Check for onboarding
          const id = data.id || data.ID;
          if (id) {
            setUserId(id.toString());
            const hasSeen = localStorage.getItem(`onboarding_seen_${id}`);
            if (!hasSeen) {
              setShowOnboarding(true);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load langs, user might be unauthenticated', err);
        router.push('/login');
      });

    fetchApi('/words/stats')
      .then(data => {
        if (!isMounted) return;
        if (data) {
          setStats(data);
        }
        setStatsLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load stats', err);
        setStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);


  const handleTranslate = async (direction: 'source-to-target' | 'target-to-source' = 'source-to-target') => {
    if (!newWord.source_word && !newWord.target_word) return;
    const isSourceToTarget = direction === 'source-to-target';
    
    try {
      sendGAEvent('event', 'translate_word', { source_lang: userLangs.source, target_lang: userLangs.target });
      setMessage({ type: '', text: '' });
      const res = await fetchApi('/words/translate', {
        method: 'POST',
        body: JSON.stringify({
          source_word: isSourceToTarget ? newWord.source_word : '',
          target_word: isSourceToTarget ? '' : newWord.target_word,
          source_lang: userLangs.source,
          target_lang: userLangs.target
        })
      });
      if (res.source_word) setNewWord(prev => ({ ...prev, source_word: res.source_word }));
      if (res.target_word) setNewWord(prev => ({ ...prev, target_word: res.target_word }));
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : "We couldn't translate that. Maybe try a different word?" });
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingWord(true);
    setMessage({ type: '', text: '' });

    try {
      sendGAEvent('event', 'add_word', { source_lang: userLangs.source, target_lang: userLangs.target });
      await fetchApi('/words/create', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          source_word: newWord.source_word,
          target_word: newWord.target_word,
          comment: newWord.comment
        })
      });
      setMessage({ type: 'success', text: t('dashboard.add_word_success') });
      setNewWord({ source_word: '', target_word: '', comment: '' });
      
      // Refresh stats
      fetchApi('/words/stats').then(setStats).catch(console.error);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('dashboard.import_error_retry') });
    } finally {
      setAddingWord(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      sendGAEvent('event', 'import_words', { file_type: file.name.split('.').pop() });
      await fetchApi('/words/import', {
        method: 'POST',
        body: formData
      });
      setMessage({ type: 'success', text: t('dashboard.import_success') });
      
      // Refresh stats after import
      fetchApi('/words/stats').then(setStats).catch(console.error);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('dashboard.import_failed') });
    } finally {
      setIsImporting(false);
      // Reset input
      e.target.value = '';
    }
  };

  useEffect(() => {
    const words = generatedWords.map(w => w.source_word.toLowerCase().trim()).filter(Boolean);
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    for (const word of words) {
      if (seen.has(word)) {
        duplicates.add(word);
      }
      seen.add(word);
    }
    setDuplicateWords(duplicates);
  }, [generatedWords]);

  const handleGenerateWordList = async () => {
    if (!selectedTopic && !userTopic.trim()) {
      setBatchMessage({ type: 'error', text: t('dashboard.select_topic_error') });
      return;
    }
    setIsGenerating(true);
    setBatchMessage({ type: '', text: '' });
    setGeneratedWords([]);
    setCurrentPage(1);
    try {
      const data: GeneratedWord[] = await fetchApi('/words/wordList', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          level: selectedLevel,
          topic: selectedTopic,
          user_topic: userTopic
        })
      });
      
      // Удаляем дубликаты сразу после генерации
      const uniqueWords: GeneratedWord[] = [];
      const seen = new Set<string>();
      
      if (data && Array.isArray(data)) {
        for (const word of data) {
          const key = word.source_word.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueWords.push(word);
          }
        }
      }
      
      setGeneratedWords(uniqueWords);
    } catch (err: unknown) {
      setBatchMessage({ type: 'error', text: err instanceof Error ? err.message : t('dashboard.generate_word_list_error') });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredWords = useMemo(() => {
    return generatedWords.filter(w => 
      w.source_word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.target_word.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [generatedWords, searchTerm]);

  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);
  const currentWords = filteredWords.slice((currentPage - 1) * wordsPerPage, currentPage * wordsPerPage);

  const handleDeleteWord = (index: number) => {
    const wordToDelete = currentWords[index];
    const newWords = generatedWords.filter(w => w !== wordToDelete);
    setGeneratedWords(newWords);
    
    // Если после удаления страница стала пустой, переходим на предыдущую
    if (currentWords.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleStartEdit = (index: number) => {
    const wordToEdit = currentWords[index];
    const originalIndex = generatedWords.findIndex(w => w === wordToEdit);
    if (originalIndex !== -1) {
      setEditingIndex(originalIndex);
      setEditWord({ ...wordToEdit });
    }
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editWord) {
      // Check for duplicates
      const isDuplicate = generatedWords.some((w, i) => 
        i !== editingIndex && w.source_word.toLowerCase().trim() === editWord.source_word.toLowerCase().trim()
      );
      if (isDuplicate) {
        setBatchMessage({ type: 'error', text: t('dashboard.duplicate_word_error', { word: editWord.source_word }) });
        return;
      }

      setGeneratedWords(prev => prev.map((w, i) => i === editingIndex ? editWord : w));
      setEditingIndex(null);
      setEditWord(null);
      setBatchMessage({ type: '', text: '' });
    }
  };

  const handleAddItemInline = () => {
    if (!newGeneratedWord.source_word.trim() || !newGeneratedWord.target_word.trim()) {
      setBatchMessage({ type: 'error', text: t('dashboard.inline_add_error') });
      return;
    }

    // Check for duplicates
    const isDuplicate = generatedWords.some(w => 
      w.source_word.toLowerCase().trim() === newGeneratedWord.source_word.toLowerCase().trim()
    );
    if (isDuplicate) {
      setBatchMessage({ type: 'error', text: t('dashboard.duplicate_word_error', { word: newGeneratedWord.source_word }) });
      // Не блокируем добавление, но информируем. На самом деле лучше блокировать.
      // В предыдущем тикете просили "валидацию чтоб нельзя было добавить слово которое уже есть в списке"
      return;
    }

    setGeneratedWords(prev => [newGeneratedWord, ...prev]);
    setNewGeneratedWord({ source_word: '', target_word: '', comment: '' });
    setSearchTerm('');
    setCurrentPage(1);
    setEditingIndex(null);
    setEditWord(null);
    setBatchMessage({ type: '', text: '' });
  };

  const handleTranslateNewInline = async (direction: 'source-to-target' | 'target-to-source' = 'source-to-target') => {
    if (!newGeneratedWord.source_word && !newGeneratedWord.target_word) return;
    const isSourceToTarget = direction === 'source-to-target';
    
    try {
      setIsTranslatingNewGenerated(true);
      const res = await fetchApi('/words/translate', {
        method: 'POST',
        body: JSON.stringify({
          source_word: isSourceToTarget ? newGeneratedWord.source_word : '',
          target_word: isSourceToTarget ? '' : newGeneratedWord.target_word,
          source_lang: userLangs.source,
          target_lang: userLangs.target
        })
      });
      if (res.source_word || res.target_word) {
        setNewGeneratedWord(prev => ({
          ...prev,
          source_word: res.source_word || prev.source_word,
          target_word: res.target_word || prev.target_word
        }));
      }
    } catch (err: unknown) {
      console.error('Inline translation failed', err);
    } finally {
      setIsTranslatingNewGenerated(false);
    }
  };

  const handleTranslateInline = async (direction: 'source-to-target' | 'target-to-source' = 'source-to-target') => {
    if (!editWord || (!editWord.source_word && !editWord.target_word)) return;
    const isSourceToTarget = direction === 'source-to-target';
    
    try {
      setIsTranslatingManual(true);
      const res = await fetchApi('/words/translate', {
        method: 'POST',
        body: JSON.stringify({
          source_word: isSourceToTarget ? editWord.source_word : '',
          target_word: isSourceToTarget ? '' : editWord.target_word,
          source_lang: userLangs.source,
          target_lang: userLangs.target
        })
      });
      if (res.source_word || res.target_word) {
        setEditWord(prev => ({
          ...prev!,
          source_word: res.source_word || prev!.source_word,
          target_word: res.target_word || prev!.target_word
        }));
      }
    } catch (err: unknown) {
      console.error('Inline translation failed', err);
    } finally {
      setIsTranslatingManual(false);
    }
  };

  const handleSaveBatch = async () => {
    if (generatedWords.length === 0) return;
    
    // Фильтруем дубликаты перед сохранением на всякий случай
    const uniqueBatch: GeneratedWord[] = [];
    const seen = new Set<string>();
    for (const w of generatedWords) {
      const key = w.source_word.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBatch.push(w);
      }
    }

    setIsSavingBatch(true);
    setBatchMessage({ type: '', text: '' });
    try {
      await fetchApi('/words/create-batch', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          words: uniqueBatch.map(w => ({
            source_word: w.source_word,
            target_word: w.target_word,
            comment: w.comment
          }))
        })
      });
      setBatchMessage({ type: 'success', text: t('dashboard.save_batch_success', { count: uniqueBatch.length }) });
      setGeneratedWords([]);
    } catch (err: unknown) {
      setBatchMessage({ type: 'error', text: err instanceof Error ? err.message : t('dashboard.save_batch_error') });
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handlePublishList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedWords.length === 0 || !publishForm.title) return;
    
    // Фильтруем дубликаты перед публикацией
    const uniqueBatch: GeneratedWord[] = [];
    const seen = new Set<string>();
    for (const w of generatedWords) {
      const key = w.source_word.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBatch.push(w);
      }
    }
    
    setIsPublishing(true);
    setBatchMessage({ type: '', text: '' });
    
    try {
      sendGAEvent('event', 'publish_list', { word_count: uniqueBatch.length });
      await fetchApi('/public-lists', {
        method: 'POST',
        body: JSON.stringify({
          title: publishForm.title,
          description: publishForm.description,
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          level: selectedLevel,
          words: uniqueBatch.map(w => ({
            source_word: w.source_word,
            target_word: w.target_word,
            comment: w.comment
          }))
        })
      });
      setBatchMessage({ type: 'success', text: t('dashboard.publish_success') });
      setShowPublishModal(false);
      setPublishForm({ title: '', description: '' });
    } catch (err: any) {
      setBatchMessage({ type: 'error', text: err.message || t('dashboard.publish_error') });
    } finally {
      setIsPublishing(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle', { 
              target: getLanguageName(userLangs.target), 
              source: getLanguageName(userLangs.source) 
            })}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                {t('dashboard.progress')}
              </h3>
              
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.new}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-500 dark:text-blue-400">{t('dashboard.new')}</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800 text-center">
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.learning}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-500 dark:text-amber-400">{t('dashboard.learning')}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.review}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-green-500 dark:text-green-400">{t('dashboard.review')}</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 text-center">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.relearning}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-red-500 dark:text-red-400">{t('dashboard.relearning')}</div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <Link 
                  href="/lesson"
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t('dashboard.start_review')}
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                {t('dashboard.ai_practice')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('dashboard.ai_practice_desc')}
              </p>
              <Link 
                href="/practice"
                className="w-full flex justify-center items-center px-4 py-2 border border-purple-200 dark:border-purple-800 text-sm font-medium rounded-md shadow-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                {t('dashboard.practice_btn')}
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-500" />
                {t('dashboard.community_lists')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('dashboard.community_lists_desc')}
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                  href="/public-lists"
                  className="w-full flex justify-center items-center px-4 py-2 border border-blue-200 dark:border-blue-800 text-sm font-medium rounded-md shadow-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {t('dashboard.public_lists.title')}
                </Link>
                <Link 
                  href="/public-lists?tab=playlists"
                  className="w-full flex justify-center items-center px-4 py-2 border border-blue-200 dark:border-blue-800 text-sm font-medium rounded-md shadow-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  {t('common.playlists') || 'Playlists'}
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <List className="w-5 h-5 mr-2 text-blue-500" />
                {t('dashboard.manage_words')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('dashboard.manage_words_desc')}
              </p>
              <Link 
                href="/words"
                className="w-full flex justify-center items-center px-4 py-2 border border-blue-200 dark:border-blue-800 text-sm font-medium rounded-md shadow-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {t('dashboard.my_words_list')}
              </Link>
            </div>

            <BuyMeACoffee />
          </div>

          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-500" />
                  {t('dashboard.add_word')}
                </h3>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                    {isImporting ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <FileUp className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {t('dashboard.import')}
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.json"
                      onChange={handleFileImport}
                      disabled={isImporting}
                    />
                  </label>
                </div>
              </div>
              
              <form onSubmit={handleAddWord} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('dashboard.translation_in', { lang: getLanguageName(userLangs.source) })}
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-700 border pl-3 pr-10 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder={t('dashboard.word_placeholder')}
                        value={newWord.source_word}
                        onChange={e => setNewWord({...newWord, source_word: e.target.value})}
                      />
                      {newWord.source_word && !newWord.target_word && (
                        <button
                          type="button"
                          onClick={() => handleTranslate('source-to-target')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title={t('dashboard.auto_translate')}
                        >
                          <Languages className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('dashboard.word_in', { lang: getLanguageName(userLangs.target) })}
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-700 border pl-3 pr-10 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder={t('dashboard.translation_placeholder')}
                        value={newWord.target_word}
                        onChange={e => setNewWord({...newWord, target_word: e.target.value})}
                      />
                      {newWord.target_word && !newWord.source_word && (
                        <button
                          type="button"
                          onClick={() => handleTranslate('target-to-source')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title={t('dashboard.auto_translate')}
                        >
                          <Languages className="w-4 h-4 rotate-180" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden">
                  <button
                    type="button"
                    onClick={() => handleTranslate()}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
                  >
                    {t('dashboard.auto_translate')}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dashboard.comment_optional')}
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={t('dashboard.usage_example')}
                    value={newWord.comment}
                    onChange={e => setNewWord({...newWord, comment: e.target.value})}
                  />
                </div>

                {message.text && (
                  <div className={`text-sm p-3 rounded-md border ${
                    message.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={addingWord}
                    className={`w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-all ${
                      (!newWord.source_word || !newWord.target_word) 
                        ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70' 
                        : 'bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-500'
                    }`}
                  >
                    {addingWord ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('dashboard.adding')}
                      </>
                    ) : null}
                    {t('common.save')}
                  </button>
                </div>
              </form>

              {(newWord.source_word || newWord.target_word) ? (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <AIWordInfoCard 
                    sourceWord={newWord.source_word} 
                    targetWord={newWord.target_word} 
                  />
                </div>
              ) : null}
            </div>

            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                  {t('dashboard.generate_ai_title')}
                </h3>
              </div>

              <div className="space-y-6">
                {/* Proficiency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dashboard.proficiency_level')}</label>
                  <div className="flex flex-wrap gap-2">
                    {proficiencyLevels.map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          selectedLevel === level
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dashboard.topic')}</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 border border-gray-50 dark:border-gray-800 rounded-lg">
                    {topicList.map(topic => (
                      <button
                        key={topic.slug}
                        onClick={() => setSelectedTopic(topic.slug === selectedTopic ? '' : topic.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedTopic === topic.slug
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        }`}
                      >
                        {t(`dashboard.topics.${topic.slug}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.custom_topic_label')}</label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={t('dashboard.custom_topic_placeholder')}
                    value={userTopic}
                    onChange={e => setUserTopic(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleGenerateWordList}
                  disabled={isGenerating}
                  className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-300 dark:disabled:bg-amber-900/50 transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {t('dashboard.generate_btn')}
                </button>

                {/* Generated List Section */}
                {generatedWords.length > 0 && (
                  <div className="mt-8 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.generated_words_title', { count: generatedWords.length })}</h4>
                      </div>
                      <div className="relative w-48">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={t('dashboard.search_placeholder')}
                          className="pl-9 w-full rounded-md border-gray-300 dark:border-gray-700 border px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500"
                          value={searchTerm}
                          onChange={e => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{getLanguageName(userLangs.source)}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{getLanguageName(userLangs.target)}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.comment')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                          {/* Top row for adding new words */}
                          <tr className={`bg-blue-50/30 dark:bg-blue-900/10 ${duplicateWords.has(newGeneratedWord.source_word.toLowerCase().trim()) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder={t('dashboard.new_word_placeholder')}
                                  className={`w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-xs ${duplicateWords.has(newGeneratedWord.source_word.toLowerCase().trim()) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}
                                  value={newGeneratedWord.source_word}
                                  onChange={e => setNewGeneratedWord(prev => ({...prev, source_word: e.target.value}))}
                                  onKeyDown={e => e.key === 'Enter' && handleAddItemInline()}
                                />
                                {newGeneratedWord.source_word && !newGeneratedWord.target_word && (
                                  <button
                                    onClick={() => handleTranslateNewInline('source-to-target')}
                                    disabled={isTranslatingNewGenerated}
                                    className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                    title={t('dashboard.auto_translate')}
                                  >
                                    {isTranslatingNewGenerated ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder={t('dashboard.translation_placeholder_inline')}
                                  className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                  value={newGeneratedWord.target_word}
                                  onChange={e => setNewGeneratedWord(prev => ({...prev, target_word: e.target.value}))}
                                  onKeyDown={e => e.key === 'Enter' && handleAddItemInline()}
                                />
                                {newGeneratedWord.target_word && !newGeneratedWord.source_word && (
                                  <button
                                    onClick={() => handleTranslateNewInline('target-to-source')}
                                    disabled={isTranslatingNewGenerated}
                                    className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                    title={t('dashboard.auto_translate')}
                                  >
                                    {isTranslatingNewGenerated ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4 rotate-180" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder={t('dashboard.comment_placeholder_inline')}
                                className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                value={newGeneratedWord.comment}
                                onChange={e => setNewGeneratedWord(prev => ({...prev, comment: e.target.value}))}
                                onKeyDown={e => e.key === 'Enter' && handleAddItemInline()}
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={handleAddItemInline}
                                className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-all active:scale-95"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                {t('common.add')}
                              </button>
                            </td>
                          </tr>
                          {currentWords.map((word, idx) => {
                            const isEditing = editingIndex === (currentPage - 1) * wordsPerPage + generatedWords.findIndex(w => w === word);
                            const isDuplicate = duplicateWords.has(word.source_word.toLowerCase().trim());
                            return (
                              <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isDuplicate ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                <td className={`px-4 py-3 text-sm font-medium ${isDuplicate ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        className={`w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-xs ${duplicateWords.has(editWord?.source_word.toLowerCase().trim() || "") ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}
                                        value={editWord?.source_word}
                                        onChange={e => setEditWord(prev => prev ? {...prev, source_word: e.target.value} : null)}
                                      />
                                      {editWord?.source_word && !editWord?.target_word && (
                                        <button
                                          onClick={() => handleTranslateInline('source-to-target')}
                                          disabled={isTranslatingManual}
                                          className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                          title={t('dashboard.auto_translate')}
                                        >
                                          {isTranslatingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                                        </button>
                                      )}
                                    </div>
                                  ) : word.source_word}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                  {isEditing ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                        value={editWord?.target_word}
                                        onChange={e => setEditWord(prev => prev ? {...prev, target_word: e.target.value} : null)}
                                      />
                                      {editWord?.target_word && !editWord?.source_word && (
                                        <button
                                          onClick={() => handleTranslateInline('target-to-source')}
                                          disabled={isTranslatingManual}
                                          className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                          title={t('dashboard.auto_translate')}
                                        >
                                          {isTranslatingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4 rotate-180" />}
                                        </button>
                                      )}
                                    </div>
                                  ) : word.target_word}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      className="w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                      value={editWord?.comment}
                                      onChange={e => setEditWord(prev => prev ? {...prev, comment: e.target.value} : null)}
                                    />
                                  ) : word.comment}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                                  {isEditing ? (
                                    <>
                                      {(editWord?.source_word || editWord?.target_word) && (
                                        <button 
                                          onClick={() => handleTranslateInline()} 
                                          disabled={isTranslatingManual}
                                          className="text-blue-500 hover:text-blue-700 disabled:opacity-50" 
                                          title={t('dashboard.auto_translate')}
                                        >
                                          {isTranslatingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                                        </button>
                                      )}
                                      <button onClick={handleSaveEdit} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300" title={t('common.save')}>
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => setEditingIndex(null)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" title={t('common.cancel')}>
                                        <X className="h-4 w-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleStartEdit(idx)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300" title={t('common.edit')}>
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => handleDeleteWord(idx)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" title={t('common.delete')}>
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 gap-3">
                        <div className="w-full flex items-center justify-between sm:hidden">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900 transition-colors"
                          >
                            {t('dashboard.previous')}
                          </button>
                          <span className="text-xs text-gray-700 dark:text-gray-400 font-medium">
                            {t('dashboard.page_info', { current: currentPage, total: totalPages })}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900 transition-colors"
                          >
                            {t('dashboard.next')}
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs text-gray-700 dark:text-gray-400">
                              {t('dashboard.page_info', { current: currentPage, total: totalPages })}
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}

                    {batchMessage.text && (
                      <div className={`text-sm p-3 rounded-md border ${
                        batchMessage.type === 'success' 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                      }`}>
                        {batchMessage.text}
                      </div>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleSaveBatch}
                        disabled={isSavingBatch || isPublishing || generatedWords.length === 0}
                        className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 dark:disabled:bg-green-900/50 transition-all transform hover:scale-[1.01]"
                      >
                        {isSavingBatch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {t('dashboard.save_to_my_list')}
                      </button>
                      <button
                        onClick={() => {
                          setPublishForm({ 
                            title: `${selectedTopic ? topicList.find(t => t.slug === selectedTopic)?.title : userTopic || 'My Word List'}`, 
                            description: '' 
                          });
                          setShowPublishModal(true);
                        }}
                        disabled={isSavingBatch || isPublishing || generatedWords.length === 0}
                        className="flex-1 flex justify-center items-center px-4 py-3 border border-gray-200 dark:border-gray-700 text-sm font-bold rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-all transform hover:scale-[1.01]"
                      >
                        <Globe className="w-4 h-4 mr-2 text-blue-500" />
                        {t('dashboard.share_with_community')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {showOnboarding && (
        <OnboardingModal 
          onClose={() => {
            setShowOnboarding(false);
            if (userId) {
              localStorage.setItem(`onboarding_seen_${userId}`, 'true');
            }
          }} 
        />
      )}

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-500" />
                  {t('dashboard.publish_title')}
                </h3>
                <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('dashboard.publish_desc', { count: generatedWords.length })}
              </p>
              
              <form onSubmit={handlePublishList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.list_title_label')}</label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('dashboard.list_title_placeholder')}
                    value={publishForm.title}
                    onChange={e => setPublishForm({...publishForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dashboard.level') || 'Level'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={selectedLevel}
                    onChange={e => setSelectedLevel(e.target.value)}
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.list_desc_label')}</label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-700 border px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('dashboard.list_desc_placeholder')}
                    value={publishForm.description}
                    onChange={e => setPublishForm({...publishForm, description: e.target.value})}
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishing || !publishForm.title}
                    className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t('dashboard.publishing')}
                      </>
                    ) : (
                      t('dashboard.publish_btn')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}