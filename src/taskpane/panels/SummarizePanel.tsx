/**
 * Glide — Summarize Panel
 *
 * UI for the "Summarize Email Thread" feature.
 * Style: bullets | paragraph | tldr
 * Length: brief | standard | detailed
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Select,
  Label,
  Card,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  SparkleRegular,
  ArrowSyncRegular,
  CopyRegular,
  TextBulletListSquareRegular,
} from '@fluentui/react-icons';
import {
  summarizeThread,
  regenerateSummary,
  copyToClipboard,
  getLastSummary,
} from '../../features/summarize-thread';
import type { SummaryStyle, SummaryLength } from '../../features/summarize-thread';
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
  fieldRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  fieldLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  preview: {
    padding: tokens.spacingVerticalM,
    whiteSpace: 'pre-wrap',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    maxHeight: '400px',
    overflow: 'auto',
  },
  resultActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
});

export const SummarizePanel: React.FC<PanelProps> = ({ showError, clearError, showLoading, hideLoading }) => {
  const styles = useStyles();

  const [style, setStyle] = useState<SummaryStyle>('bullets');
  const [length, setLength] = useState<SummaryLength>('standard');
  const [result, setResult] = useState(getLastSummary);
  const [copied, setCopied] = useState(false);

  const handleSummarize = useCallback(async () => {
    clearError();
    showLoading('Summarizing email thread…');
    try {
      const summary = await summarizeThread({ style, length });
      setResult(summary);
    } catch (err: any) {
      showError(err.message || 'Failed to summarize.');
    } finally {
      hideLoading();
    }
  }, [style, length, showError, clearError, showLoading, hideLoading]);

  const handleRegenerate = useCallback(async () => {
    clearError();
    showLoading('Regenerating summary…');
    try {
      const summary = await regenerateSummary();
      setResult(summary);
    } catch (err: any) {
      showError(err.message || 'Failed to regenerate summary.');
    } finally {
      hideLoading();
    }
  }, [showError, clearError, showLoading, hideLoading]);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Failed to copy to clipboard.');
    }
  }, [result, showError]);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <TextBulletListSquareRegular />
        Summarize Thread
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <Label className={styles.fieldLabel}>Style</Label>
          <Select value={style} onChange={(_e, data) => setStyle(data.value as SummaryStyle)}>
            <option value="bullets">Bullet Points</option>
            <option value="paragraph">Paragraph</option>
            <option value="tldr">TL;DR</option>
          </Select>
        </div>
        <div className={styles.field}>
          <Label className={styles.fieldLabel}>Length</Label>
          <Select value={length} onChange={(_e, data) => setLength(data.value as SummaryLength)}>
            <option value="brief">Brief</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </Select>
        </div>
      </div>

      <Button appearance="primary" icon={<SparkleRegular />} onClick={handleSummarize}>
        Summarize
      </Button>

      {result && (
        <>
          <Card className={styles.preview}>{result}</Card>

          <div className={styles.resultActions}>
            <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRegenerate} size="small">
              Regenerate
            </Button>
            <Button appearance="subtle" icon={<CopyRegular />} onClick={handleCopy} size="small">
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
