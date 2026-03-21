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
        <div className="MsoNormal" data-custom-class="subtitle">
          {new Date().toLocaleDateString()}
        </div>
        <div className="MsoNormal" data-custom-class="body_text">
           <p>{t('profile.terms_welcome')}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceClient;
