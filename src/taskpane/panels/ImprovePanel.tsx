/**
 * Glide — Improve Writing Panel
 *
 * UI for the "Improve Writing" feature.
 * Shows a diff view between original and improved text,
 * with an Accept Changes button.
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
  CheckmarkRegular,
  TextGrammarCheckmarkRegular,
} from '@fluentui/react-icons';
import {
  improveWriting,
  regenerateImprovement,
  acceptChanges,
  generateDiffHtml,
  getTexts,
} from '../../features/improve-writing';
import type { ImprovementFocus } from '../../features/improve-writing';
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
  diffView: {
    padding: tokens.spacingVerticalM,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    maxHeight: '400px',
    overflow: 'auto',
  },
  resultActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
});

export const ImprovePanel: React.FC<PanelProps> = ({ showError, clearError, showLoading, hideLoading }) => {
  const styles = useStyles();

  const [focus, setFocus] = useState<ImprovementFocus>('all');
  const [diffHtml, setDiffHtml] = useState('');
  const [hasResult, setHasResult] = useState(false);

  // Restore state if returning to this tab
  React.useEffect(() => {
    const texts = getTexts();
    if (texts.original && texts.improved) {
      setDiffHtml(generateDiffHtml(texts.original, texts.improved));
      setHasResult(true);
    }
  }, []);

  const handleImprove = useCallback(async () => {
    clearError();
    showLoading('Improving your writing…');
    try {
      const { original, improved } = await improveWriting({ focus });
      setDiffHtml(generateDiffHtml(original, improved));
      setHasResult(true);
    } catch (err: any) {
      showError(err.message || 'Failed to improve text.');
    } finally {
      hideLoading();
    }
  }, [focus, showError, clearError, showLoading, hideLoading]);

  const handleRegenerate = useCallback(async () => {
    clearError();
    showLoading('Regenerating improvement…');
    try {
      const { original, improved } = await regenerateImprovement();
      setDiffHtml(generateDiffHtml(original, improved));
    } catch (err: any) {
      showError(err.message || 'Failed to regenerate.');
    } finally {
      hideLoading();
    }
  }, [showError, clearError, showLoading, hideLoading]);

  const handleAccept = useCallback(async () => {
    clearError();
    try {
      const action = await acceptChanges();
      if (action === 'copied') {
        showError('Improved text copied to clipboard (not in compose mode).');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to accept changes.');
    }
  }, [showError, clearError]);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <TextGrammarCheckmarkRegular />
        Improve Writing
      </div>

      <div className={styles.field}>
        <Label className={styles.fieldLabel}>Focus area</Label>
        <Select value={focus} onChange={(_e, data) => setFocus(data.value as ImprovementFocus)}>
          <option value="all">All improvements</option>
          <option value="grammar">Grammar &amp; spelling</option>
          <option value="clarity">Clarity &amp; conciseness</option>
          <option value="tone">Tone &amp; voice</option>
          <option value="make_professional">Make professional</option>
        </Select>
      </div>

      <Button appearance="primary" icon={<SparkleRegular />} onClick={handleImprove}>
        Improve Writing
      </Button>

      {hasResult && (
        <>
          <Card className={styles.diffView}>
            <div dangerouslySetInnerHTML={{ __html: diffHtml }} />
          </Card>

          <div className={styles.resultActions}>
            <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRegenerate} size="small">
              Regenerate
            </Button>
            <Button appearance="primary" icon={<CheckmarkRegular />} onClick={handleAccept} size="small">
              Accept Changes
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
