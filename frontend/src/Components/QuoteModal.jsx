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

const QuoteModal = ({ isOpen, onOpenChange, lawyer, onSubmit }) => {
  const [caseDescription, setCaseDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!caseDescription.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        message: caseDescription,
        preferredContact: contact,
        request_type: 'quote',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Request a Quote — {lawyer?.user?.name || lawyer?.name || 'Lawyer'}</DialogTitle>
          <DialogDescription>
            Describe your case and we'll ask the lawyer to provide a fee estimate.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="case-desc" className="text-right pt-2">
              Case
            </Label>
            <Textarea
              id="case-desc"
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              className="col-span-3"
              placeholder="Briefly describe your legal situation…"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quote-contact" className="text-right">
              Contact
            </Label>
            <Input
              id="quote-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="col-span-3"
              placeholder="Your email or phone"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!caseDescription.trim() || submitting}
          >
            {submitting ? 'Sending…' : 'Request Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;
