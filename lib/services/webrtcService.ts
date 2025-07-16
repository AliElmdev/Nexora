export interface CallParticipant {
  id: string
  name: string
  stream?: MediaStream
  isLocal: boolean
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

export interface CallRoom {
  id: string
  participants: Map<string, CallParticipant>
  localStream?: MediaStream
  peerConnections: Map<string, RTCPeerConnection>
}

export class WebRTCService {
  private callRooms: Map<string, CallRoom> = new Map()
  private onParticipantUpdate?: (roomId: string, participants: CallParticipant[]) => void
  private pollingInterval?: NodeJS.Timeout
  private currentUserId?: string
  private currentRoomId?: string

  constructor() {
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      console.log('📞 WebRTC Service initialized')
    }
  }

  private async sendSignalingMessage(message: any) {
    if (typeof window === 'undefined') return
    
    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })
      
      if (!response.ok) {
        console.error('Failed to send signaling message:', response.status)
      }
    } catch (error) {
      console.error('Error sending signaling message:', error)
    }
  }

  private async joinCallRoom(roomId: string, userId: string) {
    if (typeof window === 'undefined') return
    
    try {
      const response = await fetch(`/api/calls?action=join&userId=${userId}&roomId=${roomId}`)
      if (response.ok) {
        this.currentUserId = userId
        this.currentRoomId = roomId
        this.startPolling()
        console.log(`📞 Joined call room: ${roomId}`)
      }
    } catch (error) {
      console.error('Error joining call room:', error)
    }
  }

  private async leaveCallRoom(roomId: string, userId: string) {
    if (typeof window === 'undefined') return
    
    try {
      await fetch(`/api/calls?action=leave&userId=${userId}&roomId=${roomId}`)
      this.stopPolling()
      this.currentUserId = undefined
      this.currentRoomId = undefined
      console.log(`📞 Left call room: ${roomId}`)
    } catch (error) {
      console.error('Error leaving call room:', error)
    }
  }

  private startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
    
    this.pollingInterval = setInterval(async () => {
      if (!this.currentUserId || !this.currentRoomId) return
      
      try {
        const response = await fetch(`/api/calls?action=poll&userId=${this.currentUserId}&roomId=${this.currentRoomId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            console.log(`📞 Received ${data.messages.length} signaling messages`)
            for (const message of data.messages) {
              await this.handleSignalingMessage(message)
            }
          }
        }
      } catch (error) {
        console.error('Error polling for messages:', error)
      }
    }, 1000) // Poll every second
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = undefined
    }
  }

  private async handleSignalingMessage(message: any) {
    const { type, roomId, from, to, data } = message

    switch (type) {
      case 'join_call':
        await this.handleUserJoined(roomId, from, data)
        break
      case 'leave_call':
        await this.handleUserLeft(roomId, from)
        break
      case 'user_joined':
        await this.handleUserJoined(roomId, from, data)
        break
      case 'user_left':
        await this.handleUserLeft(roomId, from, data)
        break
      case 'offer':
        await this.handleOffer(roomId, from, data)
        break
      case 'answer':
        await this.handleAnswer(roomId, from, data)
        break
      case 'ice_candidate':
        await this.handleIceCandidate(roomId, from, data)
        break
      case 'toggle_audio':
        await this.handleToggleAudio(roomId, from, data)
        break
      case 'toggle_video':
        await this.handleToggleVideo(roomId, from, data)
        break
    }
  }

  public async startCall(roomId: string, userId: string, userName: string): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      console.log(`📞 Starting call for room: ${roomId}`)

      // Connect to signaling server for this room
      await this.joinCallRoom(roomId, userId)

      // Get user media with audio and video initially disabled
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })

      // Disable audio and video tracks initially
      const audioTrack = stream.getAudioTracks()[0]
      const videoTrack = stream.getVideoTracks()[0]
      if (audioTrack) audioTrack.enabled = false
      if (videoTrack) videoTrack.enabled = false

      // Create call room
      const callRoom: CallRoom = {
        id: roomId,
        participants: new Map(),
        localStream: stream,
        peerConnections: new Map()
      }

      // Add local participant
      callRoom.participants.set(userId, {
        id: userId,
        name: userName,
        stream: stream,
        isLocal: true,
        isAudioEnabled: false, // mic off by default
        isVideoEnabled: false  // camera off by default
      })

      this.callRooms.set(roomId, callRoom)

      // Wait for WebSocket connection to be ready
      await new Promise<void>((resolve) => {
        // No explicit polling wait here, as polling is now handled by startPolling
        resolve()
      })

      // Notify signaling server
      await this.sendSignalingMessage({
        type: 'join_call',
        roomId,
        from: userId,
        data: { userName }
      })
      
      console.log(`📞 Join call message sent for user ${userName}`)

      this.updateParticipants(roomId)
      return true
    } catch (error) {
      console.error('Error starting call:', error)
      return false
    }
  }

  public async joinCall(roomId: string, userId: string, userName: string): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      console.log(`📞 Joining call for room: ${roomId}`)

      // Connect to signaling server for this room
      await this.joinCallRoom(roomId, userId)

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })

      // Get or create call room
      let callRoom = this.callRooms.get(roomId)
      if (!callRoom) {
        callRoom = {
          id: roomId,
          participants: new Map(),
          localStream: stream,
          peerConnections: new Map()
        }
        this.callRooms.set(roomId, callRoom)
      }

      // Add local participant
      callRoom.participants.set(userId, {
        id: userId,
        name: userName,
        stream: stream,
        isLocal: true,
        isAudioEnabled: false, // mic off by default
        isVideoEnabled: false  // camera off by default
      })

      // Wait for WebSocket connection to be ready
      await new Promise<void>((resolve) => {
        // No explicit polling wait here, as polling is now handled by startPolling
        resolve()
      })

      // Notify signaling server
      await this.sendSignalingMessage({
        type: 'join_call',
        roomId,
        from: userId,
        data: { userName }
      })
      
      console.log(`📞 Join call message sent for user ${userName}`)

      this.updateParticipants(roomId)
      return true
    } catch (error) {
      console.error('Error joining call:', error)
      return false
    }
  }

  public async leaveCall(roomId: string, userId: string) {
    console.log(`📞 Leaving call for room: ${roomId}`)

    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    // Stop local stream and revoke permissions
    if (callRoom.localStream) {
      console.log(`🛑 Stopping all media tracks for user ${userId}`)
      callRoom.localStream.getTracks().forEach(track => {
        console.log(`🛑 Stopping track: ${track.kind} (${track.id})`)
        track.stop()
        track.enabled = false
      })
      
      // Clear the stream reference
      callRoom.localStream = undefined
    }

    // Close all peer connections
    console.log(`🛑 Closing ${callRoom.peerConnections.size} peer connections`)
    callRoom.peerConnections.forEach((connection, peerId) => {
      console.log(`🛑 Closing peer connection with ${peerId}`)
      connection.close()
    })
    callRoom.peerConnections.clear()

    // Remove local participant
    callRoom.participants.delete(userId)
    console.log(`🛑 Removed local participant ${userId}`)

    // Notify signaling server
    await this.sendSignalingMessage({
      type: 'leave_call',
      roomId,
      from: userId
    })

    // Leave the call room
    await this.leaveCallRoom(roomId, userId)

    // Clean up if no participants left
    if (callRoom.participants.size === 0) {
      this.callRooms.delete(roomId)
      console.log(`🛑 Deleted empty call room ${roomId}`)
    } else {
      this.updateParticipants(roomId)
    }

    // Force garbage collection hint
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc()
      } catch (e) {
        // GC not available
      }
    }

    console.log(`✅ Call cleanup completed for user ${userId}`)
    
    // Check permissions after cleanup
    await this.checkMediaPermissions()
  }

  public async toggleAudio(roomId: string, userId: string, enabled: boolean) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    const participant = callRoom.participants.get(userId)
    if (!participant || !participant.isLocal) return

    if (callRoom.localStream) {
      const audioTrack = callRoom.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = enabled
        participant.isAudioEnabled = enabled
        console.log(`🎤 Audio track ${enabled ? 'enabled' : 'disabled'} for user ${userId}`)
        console.log(`🎤 Audio track settings:`, {
          id: audioTrack.id,
          kind: audioTrack.kind,
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState
        })
      } else {
        console.warn(`🎤 No audio track found for user ${userId}`)
      }
    } else {
      console.warn(`🎤 No local stream found for user ${userId}`)
    }

    await this.sendSignalingMessage({
      type: 'toggle_audio',
      roomId,
      from: userId,
      data: { enabled }
    })

    this.updateParticipants(roomId)
  }

  public async toggleVideo(roomId: string, userId: string, enabled: boolean) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    const participant = callRoom.participants.get(userId)
    if (!participant || !participant.isLocal) return

    if (callRoom.localStream) {
      const videoTrack = callRoom.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = enabled
        participant.isVideoEnabled = enabled
      }
    }

    await this.sendSignalingMessage({
      type: 'toggle_video',
      roomId,
      from: userId,
      data: { enabled }
    })

    this.updateParticipants(roomId)
  }

  public getCallParticipants(roomId: string): CallParticipant[] {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return []

    return Array.from(callRoom.participants.values())
  }

  public onParticipantsUpdate(callback: (roomId: string, participants: CallParticipant[]) => void) {
    this.onParticipantUpdate = callback
  }

  public forceStopAllMedia() {
    console.log('🛑 Force stopping all media streams')
    
    // Stop all streams in all call rooms
    this.callRooms.forEach((callRoom, roomId) => {
      if (callRoom.localStream) {
        callRoom.localStream.getTracks().forEach(track => {
          console.log(`🛑 Force stopping track: ${track.kind}`)
          track.stop()
          track.enabled = false
        })
      }
      
      // Close all peer connections
      callRoom.peerConnections.forEach(connection => {
        connection.close()
      })
    })
    
    // Clear all call rooms
    this.callRooms.clear()
    
    // Stop polling
    this.stopPolling()
    
    console.log('✅ All media streams force stopped')
  }

  public async checkMediaPermissions() {
    if (typeof window === 'undefined') return
    
    try {
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
      console.log(`📷 Camera permission: ${permissions.state}`)
      
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      console.log(`🎤 Microphone permission: ${micPermission.state}`)
      
      return {
        camera: permissions.state,
        microphone: micPermission.state
      }
    } catch (error) {
      console.log('❌ Could not check permissions:', error)
      return null
    }
  }

  private updateParticipants(roomId: string) {
    if (this.onParticipantUpdate) {
      const participants = this.getCallParticipants(roomId)
      this.onParticipantUpdate(roomId, participants)
    }
  }

  private async createPeerConnection(roomId: string, localUserId: string, remoteUserId: string) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom || !callRoom.localStream) return

    console.log(`🔗 Creating peer connection with ${remoteUserId}`)

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // Add local stream tracks individually
    const audioTrack = callRoom.localStream.getAudioTracks()[0]
    const videoTrack = callRoom.localStream.getVideoTracks()[0]
    
    if (audioTrack) {
      console.log(`🎤 Adding audio track to peer connection: ${audioTrack.enabled}`)
      peerConnection.addTrack(audioTrack, callRoom.localStream)
    }
    
    if (videoTrack) {
      console.log(`📹 Adding video track to peer connection: ${videoTrack.enabled}`)
      peerConnection.addTrack(videoTrack, callRoom.localStream)
    }

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const participant = callRoom.participants.get(remoteUserId)
      if (participant) {
        participant.stream = event.streams[0]
        console.log(`📡 Received stream from ${participant.name}:`, {
          audioTracks: event.streams[0].getAudioTracks().length,
          videoTracks: event.streams[0].getVideoTracks().length,
          audioEnabled: event.streams[0].getAudioTracks()[0]?.enabled,
          videoEnabled: event.streams[0].getVideoTracks()[0]?.enabled
        })
        
        // Monitor audio transmission
        const audioTrack = event.streams[0].getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.onended = () => console.log(`🎤 Audio track ended for ${participant.name}`)
          audioTrack.onmute = () => console.log(`🎤 Audio track muted for ${participant.name}`)
          audioTrack.onunmute = () => console.log(`🎤 Audio track unmuted for ${participant.name}`)
        }
        
        this.updateParticipants(roomId)
      }
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice_candidate',
          roomId,
          from: localUserId,
          to: remoteUserId,
          data: { candidate: event.candidate }
        })
      }
    }

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${remoteUserId}: ${peerConnection.connectionState}`)
    }

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state with ${remoteUserId}: ${peerConnection.iceConnectionState}`)
    }

    peerConnection.onsignalingstatechange = () => {
      console.log(`📡 Signaling state with ${remoteUserId}: ${peerConnection.signalingState}`)
    }

    callRoom.peerConnections.set(remoteUserId, peerConnection)

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      this.sendSignalingMessage({
        type: 'offer',
        roomId,
        from: localUserId,
        to: remoteUserId,
        data: { offer }
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  private async handleUserJoined(roomId: string, userId: string, data: any) {
    console.log(`👤 User ${data.userName} joined call in room ${roomId}`)

    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    // Add remote participant
    callRoom.participants.set(userId, {
      id: userId,
      name: data.userName,
      isLocal: false,
      isAudioEnabled: false,
      isVideoEnabled: false
    })

    // Create peer connection for new participant
    const localUserId = Array.from(callRoom.participants.keys()).find(id => 
      callRoom.participants.get(id)?.isLocal
    )
    if (localUserId) {
      await this.createPeerConnection(roomId, localUserId, userId)
    }

    this.updateParticipants(roomId)
    
    // Broadcast to all participants that someone joined
    await this.sendSignalingMessage({
      type: 'user_joined',
      roomId,
      from: userId,
      data: { userName: data.userName }
    })
  }

  private async handleUserLeft(roomId: string, userId: string, data?: any) {
    console.log(`👤 User left call in room ${roomId}`)

    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    // Remove participant
    callRoom.participants.delete(userId)

    // Close peer connection
    const peerConnection = callRoom.peerConnections.get(userId)
    if (peerConnection) {
      peerConnection.close()
      callRoom.peerConnections.delete(userId)
    }

    this.updateParticipants(roomId)
    
    // Broadcast to all participants that someone left
    await this.sendSignalingMessage({
      type: 'user_left',
      roomId,
      from: userId,
      data: { userName: data?.userName || 'Unknown User' }
    })
  }

  private async handleOffer(roomId: string, from: string, data: any) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom || !callRoom.localStream) return

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // Add local stream
    callRoom.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, callRoom.localStream!)
    })

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const participant = callRoom.participants.get(from)
      if (participant) {
        participant.stream = event.streams[0]
        this.updateParticipants(roomId)
      }
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice_candidate',
          roomId,
          from: Array.from(callRoom.participants.keys()).find(id => 
            callRoom.participants.get(id)?.isLocal
          )!,
          to: from,
          data: { candidate: event.candidate }
        })
      }
    }

    callRoom.peerConnections.set(from, peerConnection)

    // Set remote description and create answer
    try {
      await peerConnection.setRemoteDescription(data.offer)
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      this.sendSignalingMessage({
        type: 'answer',
        roomId,
        from: Array.from(callRoom.participants.keys()).find(id => 
          callRoom.participants.get(id)?.isLocal
        )!,
        to: from,
        data: { answer }
      })
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  private async handleAnswer(roomId: string, from: string, data: any) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    const peerConnection = callRoom.peerConnections.get(from)
    if (!peerConnection) return

    try {
      await peerConnection.setRemoteDescription(data.answer)
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  private async handleIceCandidate(roomId: string, from: string, data: any) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    const peerConnection = callRoom.peerConnections.get(from)
    if (!peerConnection) return

    try {
      await peerConnection.addIceCandidate(data.candidate)
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  private async handleToggleAudio(roomId: string, from: string, data: any) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    const participant = callRoom.participants.get(from)
    if (participant) {
      participant.isAudioEnabled = data.enabled
      this.updateParticipants(roomId)
    }
  }

  private async handleToggleVideo(roomId: string, from: string, data: any) {
    const callRoom = this.callRooms.get(roomId)
    if (!callRoom) return

    const participant = callRoom.participants.get(from)
    if (participant) {
      participant.isVideoEnabled = data.enabled
      this.updateParticipants(roomId)
    }
  }
}

// Create a singleton instance
export const webrtcService = new WebRTCService() 