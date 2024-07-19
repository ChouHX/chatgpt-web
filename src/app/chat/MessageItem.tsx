import {
  Avatar,
  Badge,
  Button,
  IconButton,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Tooltip,
  useClipboard,
  useColorMode,
} from '@chakra-ui/react';
import {
  IconClipboard,
  IconClipboardCheck,
  IconCode,
  IconLoader,
  IconMarkdown,
  IconMessages,
  IconPlayerPause,
  IconPlayerPlay,
  IconReload,
  IconRobot,
  IconTrash,
  IconUserHeart,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';

import { toast } from 'sonner';
import type { ChatMessage } from '../types';
import { renderMarkdown } from './markdown';
import { estimateTokens } from './token';
// import { speakText } from '../utils';
import { type Config, base64AudioToBlobUrl, generateSSML } from '@/utils/ttsutil';

interface Props {
  item: ChatMessage;
  onDelete?: (v: ChatMessage) => void;
  onRegenerate?: (v: ChatMessage) => void;
  onRetry?: (v: ChatMessage) => void;
}

export function MessageItem(props: Props) {
  const { item, onDelete, onRetry, onRegenerate } = props;

  const { colorMode } = useColorMode();
  const { onCopy: onContentCopy, hasCopied: hasContentCopied } = useClipboard(item.content || item.prompt || '');
  const { onCopy: onPromptCopy, hasCopied: hasPromptCopied } = useClipboard(item.prompt || '');

  const [showOriginContent, setShowOriginContent] = useState(false);
  const isUser = item.role === 'user';
  if (!isUser && !item.markdown) {
    item.markdown = renderMarkdown(item.content);
  }
  // ---------tts-----------
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheConfigRef = useRef<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [config] = useState<Config>({
    voiceName: '',
    rate: 1,
  });
  const fetchAudio = async (): Promise<string> => {
    const brand = localStorage.getItem('voicebrand');
    const msg = brand === 'openai' ? item.content : generateSSML(item.content, config.voiceName, config.rate);
    const url = brand === 'openai' ? '/api/openaitts' : '/api/azuretts';
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ message: msg, voice: localStorage.getItem('voicemodel') }),
      headers: {
        'Content-Type': 'application/json', // Set appropriate Content-Type for SSML
      },
    });

    if (!res.ok) {
      toast.error(`Error fetching audio. Error code: ${res.status}`);
      throw new Error('Error fetching audio');
    }

    const data = await res.json();
    return data;
  };

  const getCacheMark: () => string = () => {
    return item.content + Object.values(config).join('');
  };
  function stopTTS() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTtsPlaying(false);
  }
  async function playTTS() {
    config.voiceName = localStorage.getItem('voicemodel');
    if (!item.content.length) {
      return;
    }
    const cacheString = getCacheMark();
    if (cacheConfigRef.current === cacheString) {
      setTtsPlaying(true);
      audioRef.current?.play();
      return;
    }
    audioRef.current = null;
    setLoading(true);
    try {
      const { message: base64Audio } = await fetchAudio();
      // console.log(base64Audio)
      const url = base64AudioToBlobUrl(base64Audio);
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => {
          setTtsPlaying(false);
        };
      }
      setTtsPlaying(true);
      audioRef.current?.play();
      // save cache mark
      cacheConfigRef.current = cacheString;
    }
    catch (err) {
      console.error('Error fetching audio:', err);
    }
    finally {
      setLoading(false);
    }
    // speakText(content, (value) => {
    //   setTtsPlaying(value);
    // });
  }
  function handleTTSClick() {
    if (ttsPlaying) {
      stopTTS();
    }
    else {
      if (item.content) {
        playTTS();
      }
    }
  }
  // -----------------------
  const renderPrompt = (placement: 'top' | 'top-start' = 'top-start') => (
    <Popover placement={placement}>
      <PopoverTrigger>
        <Badge colorScheme="green" title={item.prompt} className="cursor-pointer text-[14px]" onClick={onPromptCopy}>
          Prompt
        </Badge>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader fontWeight="semibold">System Prompt</PopoverHeader>
        {/* <PopoverArrow /> */}
        <PopoverCloseButton />
        <PopoverBody className="text-[14px]">
          {item.prompt}
          {' '}
          Tokens: [
          {estimateTokens(item.prompt)}
          ]
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );

  const renderConversation = (conversationId: string) => (
    <Tooltip
      placement="top-start"
      label={`conversationId: ${conversationId}`}
      aria-label="tooltip"
      bg="gray.600"
      className="rounded"
    >
      <Badge
        colorScheme="teal"
        title={`conversationId: ${conversationId}`}
        className="flex-row cursor-pointer items-center gap-1 text-[14px] !flex"
      >
        <IconMessages size="0.8rem" />
        {conversationId.slice(-4, conversationId.length)}
      </Badge>
    </Tooltip>
  );

  const actions = (
    <div className={`absolute bottom-0 mt-1 flex ${isUser ? 'justify-end right-10' : 'left-8'}`}>
      <div className="flex items-center -mb-8 space-x-1">
        {item.conversationId ? renderConversation(item.conversationId) : null}
        {item.prompt && renderPrompt(isUser ? 'top' : 'top-start')}
        {!isUser && (
          <IconButton
            aria-label="OriginContent"
            variant="ghost"
            size="xs"
            onClick={() => setShowOriginContent(!showOriginContent)}
            icon={
              showOriginContent
                ? (
                  <IconMarkdown size="1rem" className="opacity-64" />
                  )
                : (
                  <IconCode size="1rem" className="opacity-64" />
                  )
            }
          />
        )}
        <IconButton
          aria-label="Copy"
          variant="ghost"
          size="xs"
          onClick={onContentCopy}
          icon={
            hasContentCopied || hasPromptCopied
              ? (
                <IconClipboardCheck size="1rem" className="opacity-64" />
                )
              : (
                <IconClipboard size="1rem" className="opacity-64" />
                )
          }
        />
        {item.role === 'assistant' && (
          <IconButton
            aria-label="TTS"
            variant="ghost"
            colorScheme={ttsPlaying ? 'red' : 'gray'}
            icon={isLoading ? <IconLoader size="1rem" className="spin opacity-64" /> : (!ttsPlaying ? <IconPlayerPlay size="1rem" className="opacity-64" /> : <IconPlayerPause size="1rem" className="opacity-64" />)}
            size="xs"
            onClick={() => {
              handleTTSClick();
            }}
          />
        )}
        {(item.role === 'user' || (item.role === 'assistant' && item.question)) && (
          <IconButton
            aria-label="Retry"
            variant="ghost"
            icon={<IconReload size="0.90rem" className="opacity-64" />}
            size="xs"
            onClick={() => {
              if (item.role === 'user') {
                onRetry?.(item);
              }
              else {
                onRegenerate?.(item);
              }
            }}
          />
        )}
        <IconButton
          aria-label="Delete"
          variant="ghost"
          icon={<IconTrash size="0.90rem" className="opacity-64" />}
          size="xs"
          onClick={() => onDelete?.(item)}
        />
        {item.token != null && (
          <Button size="xs" aria-label="Token" title="Token">
            {item.token}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div
      key={item.id} //
      id={item.id}
      className={`mb-10 flex flex-col ${isUser && 'items-end'} space-y-1`}
    >
      {item.time && <span className="text-xs text-gray-500">{item.time}</span>}
      <div className="relative flex flex-row space-x-2" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        {!isUser && (
          <Avatar size="sm" className="mt-1 !bg-teal-600" icon={<IconRobot size="1.3rem" stroke={1.5} />} />
        )}

        <div
          className={`flex-1 overflow-hidden rounded-lg py-2 px-3 ${
            colorMode === 'light' ? 'bg-[#EDF2F7]' : 'bg-[#021627]'
          }`}
        >
          {isUser || showOriginContent
            ? (
              <div className="whitespace-pre-wrap">{item.content || item.prompt}</div>
              )
            : (
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: item.markdown || '' }} />
              )}
        </div>

        {isUser && (
          <Avatar
            size="sm"
            className={`mt-1 ml-2 !bg-blue-800/60 `}
            icon={<IconUserHeart size="1.2rem" stroke={1.5} />}
          />
        )}
        {item.id !== '-1' && actions}
      </div>
    </div>
  );
}
