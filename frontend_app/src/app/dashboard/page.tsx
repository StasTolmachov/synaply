'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { getLanguageName } from '@/lib/languages';
import { sendGAEvent } from '@next/third-parties/google';
import Link from 'next/link';
import { BookOpen, Plus, Loader2, Brain, List, Sparkles, Search, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight, Save, Rocket, BarChart3, FileUp } from 'lucide-react';
import { AIWordInfoCard } from '@/components/AIWordInfoCard';
import { BuyMeACoffee } from '@/components/BuyMeACoffee';
import { OnboardingModal } from '@/components/OnboardingModal';

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
  const [batchMessage, setBatchMessage] = useState({ type: '', text: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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

    fetchApi('/words/GetMe')
      .then(data => {
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
        console.error('Failed to load langs, user might be unauthenticated', err);
        router.push('/login');
      });

    fetchApi('/words/stats')
      .then(data => {
        if (data) {
          setStats(data);
        }
        setStatsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load stats', err);
        setStatsLoading(false);
      });
  }, [router]);


  const handleTranslate = async () => {
    if (!newWord.source_word && !newWord.target_word) return;
    try {
      sendGAEvent('event', 'translate_word', { source_lang: userLangs.source, target_lang: userLangs.target });
      setMessage({ type: '', text: '' });
      const res = await fetchApi('/words/translate', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          source_word: newWord.source_word,
          target_word: newWord.target_word
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
      setMessage({ type: 'success', text: 'Word added successfully!' });
      setNewWord({ source_word: '', target_word: '', comment: '' });
      
      // Refresh stats
      fetchApi('/words/stats').then(setStats).catch(console.error);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : "We couldn't save your new word. Let's try one more time!" });
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
      setMessage({ type: 'success', text: 'Words imported successfully!' });
      
      // Refresh stats after import
      fetchApi('/words/stats').then(setStats).catch(console.error);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : "Failed to import words." });
    } finally {
      setIsImporting(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleGenerateWordList = async () => {
    if (!selectedTopic && !userTopic.trim()) {
      setBatchMessage({ type: 'error', text: "Please select a topic or enter your own context." });
      return;
    }
    setIsGenerating(true);
    setBatchMessage({ type: '', text: '' });
    setGeneratedWords([]);
    setCurrentPage(1);
    try {
      const data = await fetchApi('/words/wordList', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          level: selectedLevel,
          topic: selectedTopic,
          user_topic: userTopic
        })
      });
      setGeneratedWords(data || []);
    } catch (err: unknown) {
      setBatchMessage({ type: 'error', text: err instanceof Error ? err.message : "Failed to generate word list." });
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
    const actualIndex = (currentPage - 1) * wordsPerPage + index;
    const wordToDelete = currentWords[index];
    const originalIndex = generatedWords.findIndex(w => w === wordToDelete);
    if (originalIndex !== -1) {
      setGeneratedWords(prev => prev.filter((_, i) => i !== originalIndex));
    }
  };

  const handleStartEdit = (index: number) => {
    const wordToEdit = currentWords[index];
    const originalIndex = generatedWords.findIndex(w => w === wordToEdit);
    setEditingIndex(originalIndex);
    setEditWord({ ...wordToEdit });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editWord) {
      setGeneratedWords(prev => prev.map((w, i) => i === editingIndex ? editWord : w));
      setEditingIndex(null);
      setEditWord(null);
    }
  };

  const handleSaveBatch = async () => {
    if (generatedWords.length === 0) return;
    setIsSavingBatch(true);
    setBatchMessage({ type: '', text: '' });
    try {
      await fetchApi('/words/create-batch', {
        method: 'POST',
        body: JSON.stringify({
          source_lang: userLangs.source,
          target_lang: userLangs.target,
          words: generatedWords.map(w => ({
            source_word: w.source_word,
            target_word: w.target_word,
            comment: w.comment
          }))
        })
      });
      setBatchMessage({ type: 'success', text: `Successfully added ${generatedWords.length} words to your collection!` });
      setGeneratedWords([]);
    } catch (err: unknown) {
      setBatchMessage({ type: 'error', text: err instanceof Error ? err.message : "Failed to save words." });
    } finally {
      setIsSavingBatch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Learning {getLanguageName(userLangs.target)} from {getLanguageName(userLangs.source)}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Learning Progress
              </h3>
              
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                    <div className="text-2xl font-bold text-blue-700">{stats.new}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-500">New</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-center">
                    <div className="text-2xl font-bold text-amber-700">{stats.learning}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-500">Learning</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                    <div className="text-2xl font-bold text-green-700">{stats.review}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-green-500">Review</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                    <div className="text-2xl font-bold text-red-700">{stats.relearning}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-red-500">Relearning</div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <Link 
                  href="/lesson"
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Review
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                AI Practice
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Improve your vocabulary by translating AI-generated sentences based on any topic or your word list.
              </p>
              <Link 
                href="/practice"
                className="w-full flex justify-center items-center px-4 py-2 border border-purple-200 text-sm font-medium rounded-md shadow-sm text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                Practice: Sentence Translation
              </Link>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <List className="w-5 h-5 mr-2 text-blue-500" />
                Manage Words
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                View, search, edit or delete words from your collection.
              </p>
              <Link 
                href="/words"
                className="w-full flex justify-center items-center px-4 py-2 border border-blue-200 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                My Words List
              </Link>
            </div>

            <BuyMeACoffee />
          </div>

          <div className="md:col-span-2">
            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-500" />
                  Add New Word
                </h3>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                    {isImporting ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <FileUp className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Import CSV/JSON
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Word in {getLanguageName(userLangs.source)}
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g. Hello"
                      value={newWord.source_word}
                      onChange={e => setNewWord({...newWord, source_word: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Translation in {getLanguageName(userLangs.target)}
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g. Hola"
                      value={newWord.target_word}
                      onChange={e => setNewWord({...newWord, target_word: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleTranslate}
                    className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Auto-translate empty field
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment / Context (optional)
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Usage example or notes"
                    value={newWord.comment}
                    onChange={e => setNewWord({...newWord, comment: e.target.value})}
                  />
                </div>

                {message.text && (
                  <div className={`text-sm p-3 rounded-md border ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border-green-100' 
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={addingWord || !newWord.source_word || !newWord.target_word}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-400 transition-colors"
                  >
                    {addingWord ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Word
                  </button>
                </div>
              </form>

              {(newWord.source_word || newWord.target_word) ? (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <AIWordInfoCard 
                    sourceWord={newWord.source_word} 
                    targetWord={newWord.target_word} 
                  />
                </div>
              ) : null}
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                  Generate Word List with AI
                </h3>
              </div>

              <div className="space-y-6">
                {/* Proficiency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proficiency Level</label>
                  <div className="flex flex-wrap gap-2">
                    {proficiencyLevels.map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          selectedLevel === level
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 border border-gray-50 rounded-lg">
                    {topicList.map(topic => (
                      <button
                        key={topic.slug}
                        onClick={() => setSelectedTopic(topic.slug === selectedTopic ? '' : topic.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedTopic === topic.slug
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        {topic.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your own topic or context (optional)</label>
                  <textarea
                    rows={2}
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g. Words for a business meeting about marketing"
                    value={userTopic}
                    onChange={e => setUserTopic(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleGenerateWordList}
                  disabled={isGenerating}
                  className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-amber-300 transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Words
                </button>

                {/* Generated List Section */}
                {generatedWords.length > 0 && (
                  <div className="mt-8 space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Generated Words ({generatedWords.length})</h4>
                      <div className="relative w-48">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="pl-9 w-full rounded-md border-gray-300 border px-3 py-1.5 text-xs focus:ring-blue-500 focus:border-blue-500"
                          value={searchTerm}
                          onChange={e => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getLanguageName(userLangs.source)}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getLanguageName(userLangs.target)}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentWords.map((word, idx) => {
                            const isEditing = editingIndex === (currentPage - 1) * wordsPerPage + generatedWords.findIndex(w => w === word);
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                      value={editWord?.source_word}
                                      onChange={e => setEditWord(prev => prev ? {...prev, source_word: e.target.value} : null)}
                                    />
                                  ) : word.source_word}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                      value={editWord?.target_word}
                                      onChange={e => setEditWord(prev => prev ? {...prev, target_word: e.target.value} : null)}
                                    />
                                  ) : word.target_word}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                      value={editWord?.comment}
                                      onChange={e => setEditWord(prev => prev ? {...prev, comment: e.target.value} : null)}
                                    />
                                  ) : word.comment}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                                  {isEditing ? (
                                    <>
                                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900">
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => setEditingIndex(null)} className="text-red-600 hover:text-red-900">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => handleStartEdit(idx)} className="text-blue-600 hover:text-blue-900">
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => handleDeleteWord(idx)} className="text-red-600 hover:text-red-900">
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
                      <div className="flex items-center justify-between px-2 py-3 bg-white border-t">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs text-gray-700">
                              Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
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
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {batchMessage.text}
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        onClick={handleSaveBatch}
                        disabled={isSavingBatch || generatedWords.length === 0}
                        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 transition-all transform hover:scale-[1.01]"
                      >
                        {isSavingBatch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save All Words to My Learning List
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
    </div>
  );
}