/**
 * Glide — TabBar Component
 *
 * Top navigation with primary tabs (Draft, Reply) and a "More" overflow
 * menu for secondary features (Summarize, Improve, Extract, Translate).
 * Also houses the Settings gear.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import React from 'react';
import {
  TabList,
  Tab,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  makeStyles,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import {
  MailEditRegular,
  ArrowReplyRegular,
  TextBulletListSquareRegular,
  TextGrammarCheckmarkRegular,
  TaskListSquareLtrRegular,
  TranslateRegular,
  MoreHorizontalRegular,
  SettingsRegular,
} from '@fluentui/react-icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TabId = 'draft' | 'reply' | 'summarize' | 'improve' | 'extract' | 'translate';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
  },
  tabs: {
    flex: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
  },
  moreButton: {
    minWidth: 'auto',
  },
});

// ---------------------------------------------------------------------------
// Secondary tab definitions
// ---------------------------------------------------------------------------

const MORE_ITEMS: { id: TabId; label: string; icon: React.ReactElement }[] = [
  { id: 'summarize', label: 'Summarize', icon: <TextBulletListSquareRegular /> },
  { id: 'improve', label: 'Improve Writing', icon: <TextGrammarCheckmarkRegular /> },
  { id: 'extract', label: 'Action Items', icon: <TaskListSquareLtrRegular /> },
  { id: 'translate', label: 'Translate', icon: <TranslateRegular /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const styles = useStyles();

  const isMoreActive = MORE_ITEMS.some((item) => item.id === activeTab);

  // Find label for active secondary tab (for the More button label)
  const activeMoreLabel = MORE_ITEMS.find((item) => item.id === activeTab)?.label;

  return (
    <div className={styles.container}>
      <TabList
        className={styles.tabs}
        selectedValue={isMoreActive ? undefined : activeTab}
        onTabSelect={(_e, data) => onTabChange(data.value as TabId)}
        size="small"
      >
        <Tab value="draft" icon={<MailEditRegular />}>
          Draft
        </Tab>
        <Tab value="reply" icon={<ArrowReplyRegular />}>
          Reply
        </Tab>
      </TabList>

      <div className={styles.actions}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content="More tools" relationship="label">
              <Button
                className={styles.moreButton}
                appearance={isMoreActive ? 'primary' : 'subtle'}
                icon={<MoreHorizontalRegular />}
                size="small"
              >
                {activeMoreLabel || 'More'}
              </Button>
            </Tooltip>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {MORE_ITEMS.map((item) => (
                <MenuItem
                  key={item.id}
                  icon={item.icon}
                  onClick={() => onTabChange(item.id)}
                >
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <Tooltip content="Settings" relationship="label">
          <Button
            appearance="subtle"
            icon={<SettingsRegular />}
            size="small"
          />
        </Tooltip>
      </div>
    </div>
  );
};
