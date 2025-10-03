import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Payment } from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder_key'
);

const PaymentForm = ({ order, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe no está cargado correctamente');
      setLoading(false);
      return;
    }

    try {
      // Create payment intent
      const response = await api.post('/payments/stripe/create-payment-intent', {
        order_id: order.order_id
      });

      const { client_secret } = response.data;

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: order.user?.name || 'Cliente',
              email: order.user?.email || '',
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on our backend
        await api.post('/payments/stripe/confirm', {
          payment_intent_id: paymentIntent.id,
          order_id: order.order_id
        });

        toast.success('Pago procesado exitosamente');
        onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.message || 'Error al procesar el pago');
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Información del Pedido
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pedido #{order.order_number || order.order_id}
          </Typography>
          <Typography variant="h6" color="primary">
            Total: {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            }).format(order.total_amount)}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Información de la Tarjeta
            </Typography>
            <Box sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              backgroundColor: '#fafafa'
            }}>
              <CardElement options={cardElementOptions} />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!stripe || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
            >
              {loading ? 'Procesando...' : 'Pagar'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

const StripePayment = ({ order, onSuccess, onCancel }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm order={order} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};

export default StripePayment;
