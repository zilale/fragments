// ChatInput.tsx

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUp, Paperclip, Square, Mic, X } from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

interface ChatInputProps {
  error: undefined | unknown
  retry: () => void
  isLoading: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (files: File[]) => void
  children: React.ReactNode
}

export function ChatInput({
  error,
  retry,
  isLoading,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  children,
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSpeechRecognitionSupported(false)
      console.warn('Speech Recognition not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false // Stop automatically after speaking
    recognition.interimResults = false
    recognition.lang = 'en-US' // Set the language as needed

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('SpeechRecognition.onresult:', event)
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript
      }
      handleInputChange({
        target: {
          value: input + ' ' + transcript,
          name: '',
          // Add other necessary properties if needed
        } as EventTarget & HTMLTextAreaElement,
      } as React.ChangeEvent<HTMLTextAreaElement>)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log(event);
      console.error('SpeechRecognition.onerror:', event)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert('Microphone access is denied. Please allow microphone access to use this feature.')
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      console.log('SpeechRecognition.onend')
      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }, [handleInputChange, input])

  useEffect(() => {
    if (isRecording) {
      console.log('Starting Speech Recognition...')
      recognitionRef.current?.start()
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1)
      }, 1000)
    } else {
      console.log('Stopping Speech Recognition...')
      recognitionRef.current?.stop()
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordTime(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange(Array.from(e.target.files || []))
  }

  function handleFileRemove(file: File) {
    const newFiles = files ? Array.from(files).filter((f) => f !== file) : []
    handleFileChange(newFiles)
  }

  const filePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => {
      return (
        <div className="relative" key={file.name}>
          <span
            onClick={() => handleFileRemove(file)}
            className="absolute top-[-8px] right-[-8px] bg-muted rounded-full p-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </span>
          {file.type.startsWith('image/') ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="rounded-xl w-10 h-10 object-cover"
            />
          ) : file.type.startsWith('audio/') ? (
            <audio controls src={URL.createObjectURL(file)} className="w-32" />
          ) : (
            <div className="text-xs">{file.name}</div>
          )}
        </div>
      )
    })
  }, [files])

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        handleSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
    }
  }

  const toggleRecording = () => {
    if (!isSpeechRecognitionSupported) return
    setIsRecording(prev => !prev)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-2 flex flex-col mt-auto bg-background"
    >
      {error !== undefined && (
        <div className="bg-red-400/10 text-red-400 px-3 py-2 text-sm font-medium mb-2 rounded-xl">
          An unexpected error has occurred. Please{' '}
          <button type="button" className="underline" onClick={retry}>
            try again
          </button>
          .
        </div>
      )}
      <div className="shadow-md rounded-2xl border">
        <div className="flex items-center px-3 py-2 gap-1">{children}</div>
        <TextareaAutosize
          autoFocus={true}
          minRows={1}
          maxRows={5}
          className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none"
          required={true}
          placeholder="Describe your app..."
          value={input}
          onChange={handleInputChange}
        />
        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center px-3 py-2 gap-2 bg-red-100">
            <span className="text-red-500 text-sm">
              Recording: {formatTime(recordTime)}
            </span>
          </div>
        )}
        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex items-center gap-2 p-2 overflow-x-auto">
            {filePreview}
          </div>
        )}
        <div className="flex p-3 gap-2 items-center">
          <input
            type="file"
            id="multimodal"
            name="multimodal"
            accept="image/*,audio/*"
            multiple={true}
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex items-center flex-1 gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    disabled={!isMultiModal}
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl h-10 w-10"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById('multimodal')?.click()
                    }}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add attachments</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isRecording ? "secondary" : "outline"}
                    size="icon"
                    className={`rounded-xl h-10 w-10 transition-colors duration-300 ${isRecording ? 'bg-red-500' : ''}`}
                    onClick={toggleRecording}
                    disabled={!isSpeechRecognitionSupported}
                  >
                    {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSpeechRecognitionSupported
                    ? isRecording
                      ? 'Stop recording'
                      : 'Record voice'
                    : 'Speech Recognition not supported in your browser'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {files.length > 0 && filePreview}
          </div>
          <div>
            {!isLoading ? (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      type="submit"
                      className="rounded-xl h-10 w-10"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-xl h-10 w-10"
                      onClick={(e) => {
                        e.preventDefault()
                        stop()
                      }}
                    >
                      <Square className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Fragments is an open-source project made by{' '}
        <a
          href="https://e2b.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff8800]"
        >
          ✶ E2B
        </a>
      </p>
    </form>
  )
}