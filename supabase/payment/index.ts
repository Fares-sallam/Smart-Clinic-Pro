import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handlePaymentRequest } from '../_shared/payment.ts';

serve(handlePaymentRequest);
