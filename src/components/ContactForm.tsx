
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { contactFormSchema } from '@/utils/validation';
import { rateLimiter, logSecurityEvent } from '@/utils/security';

const ContactForm: React.FC = () => {
  const { t } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use enhanced validation schema
  const formSchema = contactFormSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company_name: '',
      phone: '',
      message: ''
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Rate limiting check
    const userIdentifier = values.email || 'anonymous';
    if (!rateLimiter.canMakeRequest(userIdentifier, 3, 300000)) { // 3 requests per 5 minutes
      toast.error('Too many requests. Please wait before trying again.');
      logSecurityEvent('contact_form_rate_limited', { email: values.email });
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting contact form:', values);

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-contact-email', {
        body: values
      });

      if (error) {
        console.error('Error sending email:', error);
        logSecurityEvent('contact_form_submission_failed', {
          error: error.message,
          email: values.email
        });
        toast.error('Fehler beim Versenden der Nachricht. Bitte versuchen Sie es später erneut.');
        return;
      }

      console.log('Email sent successfully:', data);
      toast.success(t('contact.form.success', 'Nachricht erfolgreich gesendet'));
      form.reset();
    } catch (error) {
      console.error('Unexpected error:', error);
      logSecurityEvent('contact_form_unexpected_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: values.email
      });
      toast.error('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('contact.form.title', 'Kontakt')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.form.name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.name', 'Name')} 
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.form.email', 'E-Mail')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.email', 'E-Mail')} 
                      type="email" 
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.form.company', 'Unternehmen (optional)')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.company', 'Ihr Unternehmen')} 
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.form.phone', 'Telefon (optional)')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.phone', 'Ihre Telefonnummer')} 
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.form.message', 'Nachricht')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('contact.form.message', 'Ihre Nachricht')} 
                      className="min-h-[120px]" 
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('contact.form.sending', 'Wird gesendet...')}
                </>
              ) : (
                t('contact.form.send', 'Nachricht senden')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
