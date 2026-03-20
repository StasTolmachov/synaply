'use client';

export const BuyMeACoffee = () => {
  return (
    <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-center">
        Support the Project
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
        If you like this app, you can support its development.
      </p>
      <div className="flex justify-center">
        <a href="https://www.buymeacoffee.com/WordsGo" target="_blank" rel="noopener noreferrer">
          <img 
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
            alt="Buy Me A Coffee" 
            style={{ height: '60px', width: '217px' }} 
          />
        </a>
      </div>
    </div>
  );
};
