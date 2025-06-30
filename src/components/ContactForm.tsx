
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
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ContactForm: React.FC = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z.object({
    name: z.string().min(1, t('contact.form.validation.nameRequired')),
    email: z.string()
      .min(1, t('contact.form.validation.emailRequired'))
      .email(t('contact.form.validation.emailInvalid')),
    subject: z.string().min(1, t('contact.form.validation.subjectRequired')),
    message: z.string().min(1, t('contact.form.validation.messageRequired'))
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    console.log('Submitting contact form:', values);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        toast.error('Fehler beim Versenden der Nachricht. Bitte versuchen Sie es später erneut.');
        return;
      }

      console.log('Email sent successfully:', data);
      toast.success(t('contact.form.success'));
      form.reset();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('contact.form.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.form.name')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.name')} 
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
                  <FormLabel>{t('contact.form.email')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.email')} 
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.form.subject')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('contact.form.subject')} 
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
                  <FormLabel>{t('contact.form.message')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('contact.form.message')} 
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
                  Wird gesendet...
                </>
              ) : (
                t('contact.form.send')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
