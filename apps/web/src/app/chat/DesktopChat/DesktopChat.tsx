import React from 'react';
import styles from './DesktopChat.module.css';
import ChatHistory from './components/ChatHistory/ChatHistory';
import ChatBox from './components/ChatBox/ChatBox';
import Sidebar from './components/Sidebar/Sidebar';
import { Message } from '../types';

interface Props {
    chatHistory: { title: string; messages: Message[] }[];
    onDeleteTopic: (index: number) => void;
    moduleTitle: string;
    messages: Message[];
    copiedMessageIndex: number | null;
    copyToClipboard: (content: string, idx: number) => void;
    loading: boolean;
    suggestions: string[];
    handleSuggestionClick: (text: string) => void;
    handleSend: () => void;
    input: string;
    setInput: (val: string) => void;
    onModelChange: (modelId: string) => void;
    handleNewTopic: () => void
    setActiveTab: React.Dispatch<React.SetStateAction<"ai" | "quick" | "history">>;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    historyViewing: boolean;
    setHistoryViewing: React.Dispatch<React.SetStateAction<boolean>>;
    error?: string;
    onSelectChat: (id: string) => void;
    onRenameChat: (id: string, title: string) => void;

}

const DesktopChat: React.FC<Props> = ({
    chatHistory,
    onDeleteTopic,
    moduleTitle,
    messages,
    copiedMessageIndex,
    copyToClipboard,
    loading,
    suggestions,
    handleSuggestionClick,
    handleSend,
    input,
    setInput,
    onModelChange,
    handleNewTopic,
    setActiveTab,
    setMessages,
    historyViewing,
    setHistoryViewing,
    error,
    onSelectChat,
    onRenameChat,
}) => {

    return (
        <div className={styles.container}>
            <Sidebar
                onModelChange={onModelChange}
                handleSuggestionClick={handleSuggestionClick} />
            <ChatBox
                moduleTitle={moduleTitle}
                copiedMessageIndex={copiedMessageIndex}
                copyToClipboard={copyToClipboard}
                messages={messages}
                loading={loading}
                error={error}
                suggestions={suggestions}
                handleSend={handleSend}
                handleSuggestionClick={handleSuggestionClick}
                input={input}
                setInput={setInput}
            />
            <ChatHistory
                chatHistory={chatHistory}
                onDeleteTopic={onDeleteTopic}
                handleNewTopic={handleNewTopic}
                setActiveTab={setActiveTab}
                setMessages={setMessages}
                historyViewing={historyViewing}
                setHistoryViewing={setHistoryViewing}
                onSelectChat={onSelectChat}
                onRenameChat={onRenameChat}
            />
        </div>
    );
};

export default DesktopChat;