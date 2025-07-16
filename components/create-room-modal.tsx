"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Room } from "@/app/page"

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (room: Omit<Room, "id" | "createdAt" | "lastActivity">) => Promise<void>
}

export function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    topic: "",
    description: "",
    category: "" as Room["category"] | "",
    maxMembers: [25],
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      console.log('=== CREATE ROOM MODAL OPENED ===')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== CREATE ROOM MODAL: FORM SUBMITTED ===')
    e.preventDefault()
    
    console.log('Form data:', formData)
    console.log('Validation check:', { 
      hasName: !!formData.name, 
      hasTopic: !!formData.topic, 
      hasCategory: !!formData.category 
    })
    
    if (!formData.name || !formData.topic || !formData.category) {
      console.error('❌ Form validation failed - missing required fields')
      return
    }

    console.log('✅ Form validation passed, starting room creation...')
    setIsCreating(true)
    
    try {
      const roomData = {
        name: formData.name,
        topic: formData.topic,
        description: formData.description,
        category: formData.category as Room["category"],
        maxMembers: formData.maxMembers[0],
        memberCount: 1, // Creator joins automatically
        isActive: true,
        createdBy: "You",
      }
      
      console.log('✅ Calling onCreateRoom with data:', roomData)
      await onCreateRoom(roomData)
      console.log('✅ onCreateRoom completed successfully')

      // Reset form
      setFormData({
        name: "",
        topic: "",
        description: "",
        category: "",
        maxMembers: [25],
      })
      onClose()
      console.log('✅ Modal closed and form reset')
    } catch (error) {
      console.error('❌ Error creating room:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      // You might want to show an error message here
    } finally {
      setIsCreating(false)
      console.log('✅ Loading state reset')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>Create a new chat room for learning and cultural exchange.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Room Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., French Conversation Practice"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., French Language Learning"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as Room["category"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="language">Language</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="arts">Arts</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this room is about..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Maximum Members: {formData.maxMembers[0]}</Label>
              <Slider
                value={formData.maxMembers}
                onValueChange={(value) => setFormData({ ...formData, maxMembers: value })}
                max={100}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
