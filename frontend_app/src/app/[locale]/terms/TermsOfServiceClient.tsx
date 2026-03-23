'use client';

import React from 'react';
import { useTranslation } from '@/components/I18nContext';

const TermsOfServiceClient = () => {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        [data-custom-class='body'], [data-custom-class='body'] * {
          background: transparent !important;
        }
        [data-custom-class='title'], [data-custom-class='title'] * {
          font-family: Arial !important;
          font-size: 26px !important;
          color: #000000 !important;
        }
        [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
          font-family: Arial !important;
          color: #595959 !important;
          font-size: 14px !important;
        }
        [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
          font-family: Arial !important;
          font-size: 19px !important;
          color: #000000 !important;
        }
        [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
          font-family: Arial !important;
          font-size: 17px !important;
          color: #000000 !important;
        }
        [data-custom-class='body_text'], [data-custom-class='body_text'] * {
          color: #595959 !important;
          font-size: 14px !important;
          font-family: Arial !important;
        }
        [data-custom-class='link'], [data-custom-class='link'] * {
          color: #3030F1 !important;
          font-size: 14px !important;
          font-family: Arial !important;
          word-break: break-word !important;
        }
        ul {
          list-style-type: square;
        }
      `}</style>

      {/* Copy of the HTML content provided by the user, wrapped to fit React */}
      <div data-custom-class="body">
        <div className="MsoNormal" data-custom-class="title">
          <h1>{t('profile.terms_title')}</h1>
        </div>
        <div className="MsoNormal" data-custom-class="subtitle" style={{ marginBottom: '20px' }}>
          {t('profile.terms_last_updated')}
        </div>

        <div className="MsoNormal" data-custom-class="body_text" style={{ 
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeeba', 
          borderRadius: '4px', 
          marginBottom: '25px',
          color: '#856404'
        }}>
           <p><strong>{t('profile.terms_beta_warning')}</strong></p>
        </div>

        {[
          { title: 'intro_title', text: 'intro_text' },
          { title: 'beta_title', text: 'beta_text' },
          { title: 'accounts_title', text: 'accounts_text' },
          { title: 'content_title', text: 'content_text' },
          { title: 'conduct_title', text: 'conduct_text' },
          { title: 'liability_title', text: 'liability_text' },
          { title: 'changes_title', text: 'changes_text' },
          { title: 'contact_title', text: 'contact_text' }
        ].map((section, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <div className="MsoNormal" data-custom-class="heading_1" style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              {t(`profile.terms_${section.title}`)}
            </div>
            <div className="MsoNormal" data-custom-class="body_text">
              <p>{t(`profile.terms_${section.text}`)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsOfServiceClient;
