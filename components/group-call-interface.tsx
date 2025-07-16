"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Minimize2, Video, VideoOff } from "lucide-react"
import { webrtcService, CallParticipant } from "@/lib/services/webrtcService"

interface GroupCallInterfaceProps {
  roomId: string
  userId: string
  userName: string
  participants: string[]
  isInCall: boolean
  onLeave: () => void
}

export function GroupCallInterface({ 
  roomId, 
  userId, 
  userName, 
  participants, 
  isInCall, 
  onLeave 
}: GroupCallInterfaceProps) {
  const [callParticipants, setCallParticipants] = useState<CallParticipant[]>([])
  const [isMuted, setIsMuted] = useState(true) // Start muted
  const [isVideoEnabled, setIsVideoEnabled] = useState(false) // Start with video off
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasConfirmedMic, setHasConfirmedMic] = useState(false)
  const [hasConfirmedVideo, setHasConfirmedVideo] = useState(false)
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set())
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const speakingCheckInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isInCall && !isConnecting) {
      handleJoinCall()
    }

    // Set up participant update listener
    webrtcService.onParticipantsUpdate((roomId, participants) => {
      console.log('📞 Call participants updated:', participants)
      setCallParticipants(participants)
    })

    return () => {
      // Cleanup when component unmounts
      console.log(`🧹 Cleaning up group call interface for user ${userId}`)
      if (isInCall) {
        webrtcService.leaveCall(roomId, userId)
      }
      if (speakingCheckInterval.current) {
        clearInterval(speakingCheckInterval.current)
        speakingCheckInterval.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      // Clear video refs
      Object.values(videoRefs.current).forEach(video => {
        if (video) {
          video.srcObject = null
        }
      })
      videoRefs.current = {}
    }
  }, [isInCall, roomId, userId])

  useEffect(() => {
    // Update video elements when participants change
    callParticipants.forEach(participant => {
      const videoElement = videoRefs.current[participant.id]
      if (videoElement && participant.stream) {
        videoElement.srcObject = participant.stream
      }
    })
  }, [callParticipants])

  useEffect(() => {
    // Start speaking detection when we have participants
    if (callParticipants.length > 0) {
      startSpeakingDetection()
    }
    return () => {
      if (speakingCheckInterval.current) {
        clearInterval(speakingCheckInterval.current)
      }
    }
  }, [callParticipants])

  const startSpeakingDetection = () => {
    if (speakingCheckInterval.current) {
      clearInterval(speakingCheckInterval.current)
    }

    speakingCheckInterval.current = setInterval(() => {
      const newSpeakingParticipants = new Set<string>()
      
      callParticipants.forEach(participant => {
        if (!participant.isLocal && participant.stream) {
          const audioTrack = participant.stream.getAudioTracks()[0]
          if (audioTrack && audioTrack.enabled) {
            // Simple volume-based speaking detection
            const audioContext = audioContextRef.current || new AudioContext()
            audioContextRef.current = audioContext
            
            const source = audioContext.createMediaStreamSource(participant.stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            
            const bufferLength = analyser.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)
            analyser.getByteFrequencyData(dataArray)
            
            // Calculate average volume
            const average = dataArray.reduce((a, b) => a + b) / bufferLength
            if (average > 30) { // Threshold for speaking
              newSpeakingParticipants.add(participant.id)
              console.log(`🎤 ${participant.name} is speaking (volume: ${average})`)
            }
          }
        }
      })
      
      setSpeakingParticipants(newSpeakingParticipants)
    }, 100) // Check every 100ms
  }

  const handleJoinCall = async () => {
    setIsConnecting(true)
    try {
      const success = await webrtcService.joinCall(roomId, userId, userName)
      if (!success) {
        console.error('Failed to join call')
        onLeave()
      }
    } catch (error) {
      console.error('Error joining call:', error)
      onLeave()
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLeaveCall = () => {
    webrtcService.leaveCall(roomId, userId)
    onLeave()
  }

  const handleToggleMute = async () => {
    if (!isMuted) {
      // User is trying to unmute
      if (!hasConfirmedMic) {
        const ok = window.confirm('Are you sure you want to turn on your microphone?')
        if (!ok) return
        setHasConfirmedMic(true)
      }
    }
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    await webrtcService.toggleAudio(roomId, userId, !newMutedState)
    console.log(`🎤 ${newMutedState ? 'Muted' : 'Unmuted'} microphone`)
  }

  const handleToggleVideo = async () => {
    if (!isVideoEnabled) {
      // User is trying to enable video
      if (!hasConfirmedVideo) {
        const ok = window.confirm('Are you sure you want to turn on your camera?')
        if (!ok) return
        setHasConfirmedVideo(true)
      }
    }
    const newVideoState = !isVideoEnabled
    setIsVideoEnabled(newVideoState)
    await webrtcService.toggleVideo(roomId, userId, newVideoState)
    console.log(`📹 ${newVideoState ? 'Enabled' : 'Disabled'} camera`)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isMinimized) {
    return (
      <div className="bg-green-100 border-b border-green-200 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">
              Group Call ({callParticipants.length} participants)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="text-green-700 hover:text-green-900"
            >
              Expand
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLeaveCall} className="text-red-600 hover:text-red-800">
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="m-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-gray-900">Group Call</h3>
            <Badge variant="secondary">{callParticipants.length} participants</Badge>
            {isConnecting && <Badge variant="outline">Connecting...</Badge>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {callParticipants.map((participant) => {
            const isSpeaking = speakingParticipants.has(participant.id)
            const showVideo = participant.isVideoEnabled && participant.stream
            
            return (
              <div key={participant.id} className={`relative ${isSpeaking ? 'ring-2 ring-green-500' : ''}`}>
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  {showVideo ? (
                    <video
                      ref={(el) => { videoRefs.current[participant.id] = el }}
                      autoPlay
                      playsInline
                      muted={participant.isLocal}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="text-sm">{getInitials(participant.name)}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  {/* Participant name overlay */}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {participant.name} {participant.isLocal && '(You)'}
                  </div>

                  {/* Audio/Video status indicators */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {!participant.isAudioEnabled && (
                      <div className="bg-red-500 rounded-full p-1">
                        <MicOff className="h-2 w-2 text-white" />
                      </div>
                    )}
                    {!participant.isVideoEnabled && (
                      <div className="bg-red-500 rounded-full p-1">
                        <VideoOff className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Speaking indicator */}
                  {isSpeaking && (
                    <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1 animate-pulse">
                      <Mic className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Call Controls */}
        {isInCall && (
          <div className="flex justify-center space-x-3">
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleMute}
              className="rounded-full"
              disabled={!hasConfirmedMic && !isMuted} // Disable if not confirmed and trying to unmute
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="sm"
              onClick={handleToggleVideo}
              className="rounded-full"
              disabled={!hasConfirmedVideo && !isVideoEnabled} // Disable if not confirmed and trying to enable video
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>

            <Button variant="destructive" size="sm" onClick={handleLeaveCall} className="rounded-full">
              <PhoneOff className="h-4 w-4" />
            </Button>

            <Button
              variant={isSpeakerOn ? "default" : "outline"}
              size="sm"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className="rounded-full"
            >
              {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
