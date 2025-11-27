import { useEffect, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initI18n } from './i18n.ts';
import { bitable } from '@lark-base-open/js-sdk';
import './index.css';
import { Suspense } from 'react';

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

function LoadApp() {
    useEffect(() => {
        bitable.bridge
            .getLanguage()
            .then((lang) => {
                initI18n(lang as any);
            })
            .catch((e) => {
                console.log('getLanguage error', e);
            });
    }, []);

    return (
        <Suspense fallback="loading">
            <App />
        </Suspense>
    );
}

root.render(<LoadApp />);
