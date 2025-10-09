import styles from './ChatHistory.module.css';
import { Message } from '../../../types';
import React, { useState } from 'react';
import { FiMessageSquare } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { TbLayoutSidebarRightExpand } from "react-icons/tb";
import { TbLayoutSidebarLeftExpand } from "react-icons/tb";
import { FiEdit2, FiCheck } from "react-icons/fi";

interface Props {
    chatHistory: { title: string; messages: Message[] }[];
    onDeleteTopic: (index: number) => void;
    handleNewTopic: () => void;
    setActiveTab: React.Dispatch<React.SetStateAction<"ai" | "quick" | "history">>;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    historyViewing: boolean;
    setHistoryViewing: React.Dispatch<React.SetStateAction<boolean>>;
    onSelectChat: (id: string) => void;
    onRenameChat: (id: string, title: string) => void;
}


const ChatHistory: React.FC<Props> = ({
    chatHistory,
    onDeleteTopic,
    handleNewTopic,
    setActiveTab,
    setMessages,
    historyViewing,
    setHistoryViewing,
    onSelectChat,
    onRenameChat
}) => {

    const [visible, setVisible] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string>("");
    const expandFunction = () => {
        setVisible(!visible);
    }

    return (
        <>
            {visible && (
                <div className={styles.container}>

                    <>
                        <div className={styles.header}>
                            <div className={styles.headerInnerContainer}>
                                <FiMessageSquare size={25} />
                                <span> Chat History</span>
                            </div>

                            <TbLayoutSidebarLeftExpand onClick={expandFunction} />
                        </div>

                        <Button variant="outline" className="mb-4" onClick={handleNewTopic}>
                            + New Topic
                        </Button>

                        {chatHistory.length === 0 ? (
                            <p>
                                No previous topics
                            </p>
                        ) : (
                            chatHistory.map((topic, idx) => (
                                <div
                                    key={idx}
                                    className={styles.historyItem}
                                >
                                    {editingId === (topic as any).id ? (
                                        <div className={styles.historyEditRow}>
                                            <input
                                                className={styles.historyEditInput}
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        onRenameChat((topic as any).id, editingTitle.trim() || topic.title);
                                                        setEditingId(null);
                                                    }
                                                }}
                                            />
                                            <FiCheck
                                                className={styles.editIcon}
                                                onClick={() => {
                                                    onRenameChat((topic as any).id, editingTitle.trim() || topic.title);
                                                    setEditingId(null);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            className={styles.historyButton}
                                            onClick={() => {
                                                setHistoryViewing(true);
                                                onSelectChat((topic as any).id);
                                                setActiveTab("ai");
                                            }}
                                        >
                                            <span className={styles.historyName}>{topic.title}</span>
                                        </button>
                                    )}
                                    <RiDeleteBin6Line
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteTopic(idx);
                                        }}
                                        className={styles.deleteIcon}
                                    />
                                    {editingId !== (topic as any).id && (
                                        <FiEdit2
                                            className={styles.editIcon}
                                            onClick={() => {
                                                setEditingId((topic as any).id);
                                                setEditingTitle(topic.title);
                                            }}
                                        />
                                    )}


                                </div>
                            ))
                        )}
                    </>

                </div>
            )}

            {visible === false && (
                <div className={styles.closedContainer}>
                    <div className={styles.header}>
                        <TbLayoutSidebarRightExpand onClick={expandFunction} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatHistory;