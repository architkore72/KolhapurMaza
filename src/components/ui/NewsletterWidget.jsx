import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function NewsletterWidget() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('subscribers').insert({ email: email.trim() });
      if (error) {
        if (error.code === '23505') {
          toast.error('You are already subscribed!');
        } else {
          throw error;
        }
      } else {
        toast.success('Subscribed successfully!');
        setEmail('');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-red-700 rounded-xl p-5 text-white">
      <h3 className="font-bold text-lg mb-1">Newsletter</h3>
      <p className="text-red-100 text-sm mb-3">Get the latest news delivered to your inbox.</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          className="w-full px-3 py-2 rounded bg-white/20 placeholder-red-200 text-white border border-white/30 focus:outline-none focus:border-white text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-white text-red-700 font-semibold rounded hover:bg-red-50 transition-colors text-sm disabled:opacity-60"
        >
          {loading ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>
    </div>
  );
}
