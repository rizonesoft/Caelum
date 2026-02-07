/**
 * Glide — Translate Panel
 *
 * UI for the "Quick Translate" feature.
 * Displays original and translated text side-by-side.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Select,
  Label,
  Card,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  SparkleRegular,
  ArrowSyncRegular,
  CopyRegular,
  TranslateRegular,
} from '@fluentui/react-icons';
import {
  translateEmail,
  regenerateTranslation,
  copyToClipboard,
  getLastResult,
  LANGUAGES,
} from '../../features/translate';
import type { TranslateResult } from '../../features/translate';
import type { PanelProps } from './types';

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  heading: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  fieldLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  sideBySide: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  translationCard: {
    padding: tokens.spacingVerticalM,
    maxHeight: '200px',
    overflow: 'auto',
  },
  cardLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalXS,
    display: 'block',
  },
  cardText: {
    whiteSpace: 'pre-wrap',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  resultActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
});

export const TranslatePanel: React.FC<PanelProps> = ({ showError, clearError, showLoading, hideLoading }) => {
  const styles = useStyles();

  const lastResult = getLastResult();
  const [language, setLanguage] = useState('es');
  const [result, setResult] = useState<TranslateResult | null>(lastResult);
  const [copied, setCopied] = useState(false);

  const handleTranslate = useCallback(async () => {
    clearError();
    const langName = LANGUAGES.find((l) => l.code === language)?.name || language;
    showLoading(`Translating to ${langName}…`);
    try {
      const tr = await translateEmail(langName);
      setResult(tr);
    } catch (err: any) {
      showError(err.message || 'Failed to translate.');
    } finally {
      hideLoading();
    }
  }, [language, showError, clearError, showLoading, hideLoading]);

  const handleRegenerate = useCallback(async () => {
    clearError();
    showLoading('Regenerating translation…');
    try {
      const langName = LANGUAGES.find((l) => l.code === language)?.name || language;
      const tr = await regenerateTranslation(langName);
      setResult(tr);
    } catch (err: any) {
      showError(err.message || 'Failed to regenerate.');
    } finally {
      hideLoading();
    }
  }, [language, showError, clearError, showLoading, hideLoading]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await copyToClipboard(result.translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Failed to copy to clipboard.');
    }
  }, [result, showError]);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <TranslateRegular />
        Quick Translate
      </div>

      <div className={styles.field}>
        <Label className={styles.fieldLabel}>Target language</Label>
        <Select value={language} onChange={(_e, data) => setLanguage(data.value)}>
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </Select>
      </div>

      <Button appearance="primary" icon={<SparkleRegular />} onClick={handleTranslate}>
        Translate Email
      </Button>

      {result && (
        <>
          <div className={styles.sideBySide}>
            <Card className={styles.translationCard}>
              <Text className={styles.cardLabel}>Original</Text>
              <div className={styles.cardText}>{result.original}</div>
            </Card>
            <Card className={styles.translationCard}>
              <Text className={styles.cardLabel}>{result.targetLanguage}</Text>
              <div className={styles.cardText}>{result.translated}</div>
            </Card>
          </div>

          <div className={styles.resultActions}>
            <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRegenerate} size="small">
              Regenerate
            </Button>
            <Button appearance="subtle" icon={<CopyRegular />} onClick={handleCopy} size="small">
              {copied ? 'Copied!' : 'Copy Translation'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
