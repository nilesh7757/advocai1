import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Textarea } from '@/Components/ui/textarea';
import { CalendarDays } from 'lucide-react';

const DAY_LABELS = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const AvailabilityPreview = ({ availability }) => {
  if (!availability || availability.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 mb-2">
      <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
        <CalendarDays className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">Lawyer Availability</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {availability.map((slot) => (
          <span key={slot.day} className="text-xs text-foreground">
            <span className="font-semibold">{DAY_LABELS[slot.day] || slot.day}</span>{' '}
            {fmt12(slot.start_time)}–{fmt12(slot.end_time)}
          </span>
        ))}
      </div>
    </div>
  );
};

const ConnectModal = ({ isOpen, onOpenChange, lawyer, onConnect }) => {
  const [message, setMessage] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const handleSubmit = () => {
    onConnect({
      message,
      preferredContact,
      preferredTime,
      request_type: 'consultation',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Connect with {lawyer?.user?.name || 'Lawyer'}</DialogTitle>
          <DialogDescription>
            Send a consultation request with your details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <AvailabilityPreview availability={lawyer?.availability} />

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="message" className="text-right pt-2">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3"
              placeholder="Describe your legal issue (optional)"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">
              Contact
            </Label>
            <Input
              id="contact"
              value={preferredContact}
              onChange={(e) => setPreferredContact(e.target.value)}
              className="col-span-3"
              placeholder="Your email or phone"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Preferred Time
            </Label>
            <Input
              id="time"
              type="datetime-local"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectModal;
