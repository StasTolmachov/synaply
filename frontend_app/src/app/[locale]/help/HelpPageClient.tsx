'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft, BookOpen, Plus, Star, Sparkles, GraduationCap, List, Lightbulb } from 'lucide-react';
import { useTranslation } from '@/components/I18nContext';

const HelpPageClient = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.back_to_dashboard')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('help.title')}</h1>
        </div>

        <div className="space-y-12">
          {/* Section: Best Practice */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Lightbulb className="w-6 h-6 mr-3 text-yellow-300" />
              {t('help.best_practice.title')}
            </h2>
            <div className="space-y-4 text-blue-50">
              <p className="text-lg leading-relaxed">
                {t('help.best_practice.strategy_desc')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold mb-2">{t('help.best_practice.step1_title')}</div>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('help.best_practice.step1_desc') }} />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold mb-2">{t('help.best_practice.step2_title')}</div>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('help.best_practice.step2_desc') }} />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold mb-2">{t('help.best_practice.step3_title')}</div>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('help.best_practice.step3_desc') }} />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Getting Started */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Star className="w-6 h-6 mr-3 text-yellow-500" />
              {t('help.getting_started.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
              {t('help.getting_started.desc')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">{t('help.getting_started.step1_title')}</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">{t('help.getting_started.step1_desc')}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-2">{t('help.getting_started.step2_title')}</h3>
                <p className="text-sm text-purple-800 dark:text-purple-400">{t('help.getting_started.step2_desc')}</p>
              </div>
            </div>
          </section>

          {/* Section: Adding Words */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Plus className="w-6 h-6 mr-3 text-blue-600" />
              {t('help.adding_words.title')}
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">1</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('help.adding_words.manual.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('help.adding_words.manual.desc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">2</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('help.adding_words.auto_translate.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm" dangerouslySetInnerHTML={{ __html: t('help.adding_words.auto_translate.desc') }} />
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">3</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('help.adding_words.ai_list.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('help.adding_words.ai_list.desc')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 mr-4">4</div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('help.adding_words.ai_insights.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('help.adding_words.ai_insights.desc')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Vocabulary Review */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-green-600" />
              {t('help.spaced_repetition.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
              {t('help.spaced_repetition.desc')}
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-green-200 dark:border-green-900 pl-4 py-2">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('help.spaced_repetition.process_title')}</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-2">
                  <li>{t('help.spaced_repetition.step1')}</li>
                  <li dangerouslySetInnerHTML={{ __html: t('help.spaced_repetition.step2') }} />
                  <li dangerouslySetInnerHTML={{ __html: t('help.spaced_repetition.step3') }} />
                  <li>{t('help.spaced_repetition.step4')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section: AI Practice */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-3 text-purple-600" />
              {t('help.ai_practice.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('help.ai_practice.desc')}
            </p>
            <div className="grid grid-cols-1 gap-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{t('help.ai_practice.how_it_works')}</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li dangerouslySetInnerHTML={{ __html: t('help.ai_practice.step1') }} />
                  <li>{t('help.ai_practice.step2')}</li>
                  <li>{t('help.ai_practice.step3')}</li>
                  <li dangerouslySetInnerHTML={{ __html: t('help.ai_practice.step4') }} />
                </ol>
              </div>
            </div>
          </section>

          {/* Section: Managing Words */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <List className="w-6 h-6 mr-3 text-blue-500" />
              {t('help.dictionary_management.title')}
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm">
              <p className="flex items-center" dangerouslySetInnerHTML={{ __html: `<span class="mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>` + t('help.dictionary_management.search') }} />
              <p className="flex items-center" dangerouslySetInnerHTML={{ __html: `<span class="mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg></span>` + t('help.dictionary_management.sorting') }} />
              <p className="flex items-center" dangerouslySetInnerHTML={{ __html: `<span class="mr-2 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></span>` + t('help.dictionary_management.delete_all') }} />
            </div>
          </section>

          {/* Section: Progress */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <GraduationCap className="w-6 h-6 mr-3 text-blue-600" />
              {t('help.progress.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('help.progress.desc')}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpPageClient;
