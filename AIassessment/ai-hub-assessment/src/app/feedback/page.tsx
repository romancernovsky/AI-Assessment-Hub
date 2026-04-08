'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Star, Send, CheckCircle2 } from 'lucide-react';

export default function FeedbackPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    rating: 0,
    content: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      setErrorMessage('Please select a rating');
      return;
    }
    if (!formData.content.trim()) {
      setErrorMessage('Please provide your feedback');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json();
        setErrorMessage(data.message || 'Failed to submit feedback');
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#ff4e00]/10 border border-[#ff4e00]/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#ff4e00]" />
          </div>
        </div>
        <h1 className="text-4xl font-medium mb-4 text-foreground">Thank You!</h1>
        <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
          Your feedback has been received. We appreciate your input as we continue to improve the assessment experience.
        </p>
        <Button onClick={() => window.location.href = '/'} className="px-8">
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 animate-fade-in-up">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl font-medium tracking-tight">
          Share Your <span className="text-[#ff4e00]">Feedback</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Help us shape the future of the AI Competency Assessment.
        </p>
      </div>

      <div className="p-8 md:p-10 border border-border bg-card">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Name (Optional)</label>
              <Input 
                placeholder="How should we call you?"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Email (Optional)</label>
              <Input 
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 text-center pb-2 border-b border-white/5">
            <label className="text-sm font-bold uppercase tracking-widest text-primary">Rate your experience</label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, rating: star})}
                  className={`p-3 transition-all duration-300 ${
                    formData.rating >= star 
                    ? 'bg-[#ff4e00]/20 text-[#ff4e00] scale-110 shadow-lg shadow-[#ff4e00]/10' 
                    : 'bg-muted text-muted-foreground/40 hover:bg-border hover:text-muted-foreground'
                  }`}
                >
                  <Star className={`w-8 h-8 ${formData.rating >= star ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            {formData.rating > 0 && (
              <p className="text-sm font-medium text-[#ff4e00]/80 animate-in fade-in zoom-in duration-300">
                {['Need Improvement', 'Fair', 'Good', 'Very Good', 'Excellent'][formData.rating - 1]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">Your Message</label>
            <TextArea 
              rows={5}
              placeholder="What's on your mind? We value specific insights about the assessment scenarios, results, or general UX."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="resize-none"
              required
            />
          </div>

          {errorMessage && (
            <div className="p-4 bg-muted/50 border-l-2 border-l-destructive border border-border text-foreground text-sm font-medium animate-shake">
              {errorMessage}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full py-4 text-lg font-bold flex items-center justify-center gap-3"
          >
            {status === 'submitting' ? (
              <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" /> Submit Feedback
              </>
            )}
          </Button>
        </form>
      </div>
      
      <p className="text-center text-muted-foreground/50 text-xs mt-8">
        Your data is used solely to improve our platform. By submitting, you agree to our privacy policy.
      </p>
    </div>
  );
}
