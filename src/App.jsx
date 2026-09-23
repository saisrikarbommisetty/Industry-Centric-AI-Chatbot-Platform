import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/common/Layout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// Dashboard & Bots
import { Dashboard } from './pages/dashboard/Dashboard';
import { BotsList } from './pages/bots/BotsList';

// Wizard Flow
import { CreateBotWizard } from './pages/wizard/CreateBotWizard';
import { BotCreatedSuccess } from './pages/wizard/BotCreatedSuccess';

// Bot Suite Pages
import { BotOverview } from './pages/bot/BotOverview';
import { BotChatHistory } from './pages/bot/BotChatHistory';
import { BotAnalytics } from './pages/bot/BotAnalytics';
import { BotKnowledge } from './pages/bot/BotKnowledge';
import { BotShare } from './pages/bot/BotShare';
import { BotSettings } from './pages/bot/BotSettings';

// Global Suite Pages
import { GlobalHistory } from './pages/global/GlobalHistory';
import { GlobalAnalytics } from './pages/global/GlobalAnalytics';
import { PricingPage } from './pages/global/PricingPage';
import { AccountPage } from './pages/global/AccountPage';
import { HelpDocsPage } from './pages/global/HelpDocsPage';

// Standalone Public Chat Preview
import { PublicChatPreview } from './pages/chat/PublicChatPreview';

export const App = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Standalone Customer Chat Preview */}
      <Route path="/chat/:botId" element={<PublicChatPreview />} />

      {/* Authenticated Workspace Shell */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        
        {/* Bots Hub & Wizard */}
        <Route path="/bots" element={<BotsList />} />
        <Route path="/bots/create" element={<CreateBotWizard />} />
        <Route path="/bots/create/success/:botId" element={<BotCreatedSuccess />} />

        {/* Single Bot Suite Routes */}
        <Route path="/bots/:botId" element={<Navigate to="overview" replace />} />
        <Route path="/bots/:botId/overview" element={<BotOverview />} />
        <Route path="/bots/:botId/conversations" element={<BotChatHistory />} />
        <Route path="/bots/:botId/chat-history" element={<Navigate to="../conversations" replace />} />
        <Route path="/bots/:botId/analytics" element={<BotAnalytics />} />
        <Route path="/bots/:botId/knowledge" element={<BotKnowledge />} />
        <Route path="/bots/:botId/share" element={<BotShare />} />
        <Route path="/bots/:botId/settings" element={<BotSettings />} />

        {/* Global Platform Pages */}
        <Route path="/global-history" element={<GlobalHistory />} />
        <Route path="/global-analytics" element={<GlobalAnalytics />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/help" element={<HelpDocsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
