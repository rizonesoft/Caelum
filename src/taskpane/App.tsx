/**
 * Glide — Root App Component
 *
 * Wraps everything in FluentProvider with theme detection.
 * Contains tab navigation and renders the active feature panel.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { TabBar, type TabId } from './components/TabBar';
import { DraftPanel } from './panels/DraftPanel';
import { ReplyPanel } from './panels/ReplyPanel';
import { SummarizePanel } from './panels/SummarizePanel';
import { ImprovePanel } from './panels/ImprovePanel';
import { ExtractPanel } from './panels/ExtractPanel';
import { TranslatePanel } from './panels/TranslatePanel';

/* global Office */

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
  },
  errorBar: {
    marginBottom: tokens.spacingVerticalS,
  },
  spinnerOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL,
  },
});

// ---------------------------------------------------------------------------
// Theme detection
// ---------------------------------------------------------------------------

function getOfficeTheme(): 'light' | 'dark' {
  try {
    const theme = Office.context?.officeTheme;
    if (theme) {
      // Office provides body background color — if it's dark, use dark theme
      const bg = theme.bodyBackgroundColor?.toLowerCase() ?? '';
      if (bg && bg !== '#ffffff' && bg !== 'white') {
        const r = parseInt(bg.slice(1, 3), 16);
        const g = parseInt(bg.slice(3, 5), 16);
        const b = parseInt(bg.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance < 0.5) return 'dark';
      }
    }
  } catch {
    // Ignore — fall through to default
  }
  return 'light';
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export const App: React.FC = () => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<TabId>('draft');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(getOfficeTheme);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Listen for theme changes
  useEffect(() => {
    try {
      if (Office.context?.officeTheme?.onChanged) {
        Office.context.officeTheme.onChanged.add(() => {
          setThemeMode(getOfficeTheme());
        });
      }
    } catch {
      // Not supported — skip
    }
  }, []);

  const theme = themeMode === 'dark' ? webDarkTheme : webLightTheme;

  const showError = useCallback((msg: string) => setError(msg), []);
  const clearError = useCallback(() => setError(null), []);

  const showLoading = useCallback((msg?: string) => {
    setLoading(true);
    setLoadingMessage(msg || 'Working on it…');
  }, []);
  const hideLoading = useCallback(() => setLoading(false), []);

  const renderPanel = () => {
    const commonProps = { showError, clearError, showLoading, hideLoading };

    switch (activeTab) {
      case 'draft':
        return <DraftPanel {...commonProps} />;
      case 'reply':
        return <ReplyPanel {...commonProps} />;
      case 'summarize':
        return <SummarizePanel {...commonProps} />;
      case 'improve':
        return <ImprovePanel {...commonProps} />;
      case 'extract':
        return <ExtractPanel {...commonProps} />;
      case 'translate':
        return <TranslatePanel {...commonProps} />;
      default:
        return <DraftPanel {...commonProps} />;
    }
  };

  return (
    <FluentProvider theme={theme}>
      <div className={styles.root}>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className={styles.content}>
          {error && (
            <MessageBar intent="error" className={styles.errorBar}>
              <MessageBarBody>
                <MessageBarTitle>Error</MessageBarTitle>
                {error}
              </MessageBarBody>
              <MessageBarActions>
                <Button
                  appearance="transparent"
                  icon={<DismissRegular />}
                  onClick={clearError}
                  size="small"
                />
              </MessageBarActions>
            </MessageBar>
          )}

          {loading ? (
            <div className={styles.spinnerOverlay}>
              <Spinner size="medium" label={loadingMessage} />
            </div>
          ) : (
            renderPanel()
          )}
        </div>
      </div>
    </FluentProvider>
  );
};
