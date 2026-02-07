/**
 * Glide — Extract Action Items Panel
 *
 * UI for the "Extract Action Items" feature.
 * Displays a checklist of extracted tasks with owners and deadlines.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  SparkleRegular,
  ArrowSyncRegular,
  CopyRegular,
  TaskListSquareLtrRegular,
} from '@fluentui/react-icons';
import {
  extractActionItems,
  regenerateActions,
  formatAsTaskList,
  copyToClipboard,
  getLastItems,
} from '../../features/extract-actions';
import type { ActionItem } from '../../features/extract-actions';
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
  list: {
    padding: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    maxHeight: '400px',
    overflow: 'auto',
  },
  item: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'flex-start',
  },
  itemBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  meta: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  resultActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  empty: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
});

export const ExtractPanel: React.FC<PanelProps> = ({ showError, clearError, showLoading, hideLoading }) => {
  const styles = useStyles();

  const [items, setItems] = useState<ActionItem[]>(getLastItems);
  const [copied, setCopied] = useState(false);

  const handleExtract = useCallback(async () => {
    clearError();
    showLoading('Extracting action items…');
    try {
      const extracted = await extractActionItems();
      setItems(extracted);
    } catch (err: any) {
      showError(err.message || 'Failed to extract action items.');
    } finally {
      hideLoading();
    }
  }, [showError, clearError, showLoading, hideLoading]);

  const handleRegenerate = useCallback(async () => {
    clearError();
    showLoading('Re-extracting action items…');
    try {
      const extracted = await regenerateActions();
      setItems(extracted);
    } catch (err: any) {
      showError(err.message || 'Failed to regenerate.');
    } finally {
      hideLoading();
    }
  }, [showError, clearError, showLoading, hideLoading]);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(formatAsTaskList(items));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Failed to copy to clipboard.');
    }
  }, [items, showError]);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <TaskListSquareLtrRegular />
        Extract Action Items
      </div>

      <Button appearance="primary" icon={<SparkleRegular />} onClick={handleExtract}>
        Extract from Email
      </Button>

      {items.length > 0 && (
        <>
          <Card className={styles.list}>
            {items.map((item, i) => (
              <div key={i} className={styles.item}>
                <Checkbox />
                <div className={styles.itemBody}>
                  <Text>{item.task}</Text>
                  <div className={styles.meta}>
                    {item.owner && item.owner !== '—' && (
                      <span><Text weight="semibold">Owner:</Text> {item.owner}</span>
                    )}
                    {item.deadline && item.deadline !== '—' && (
                      <span><Text weight="semibold">Due:</Text> {item.deadline}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>

          <div className={styles.resultActions}>
            <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRegenerate} size="small">
              Regenerate
            </Button>
            <Button appearance="subtle" icon={<CopyRegular />} onClick={handleCopy} size="small">
              {copied ? 'Copied!' : 'Copy as Text'}
            </Button>
          </div>
        </>
      )}

      {items.length === 0 && getLastItems().length === 0 && null}
    </div>
  );
};
