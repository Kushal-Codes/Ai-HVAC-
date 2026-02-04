
import { VAPI_SYSTEM_PROMPT } from '../constants';
import { OutboundCall } from '../types';

const VAPI_API_URL = 'https://api.vapi.ai';
const VAPI_KEY = process.env.VAPI_KEY;

export interface StartCallParams {
  phoneNumber: string;
  customerName: string;
  jobType: string;
  callReason: string;
  availableTimeSlots: string;
  bookingId?: string;
}

export class CallService {
  /**
   * TASK 2: Initiates an outbound call via VAPI API
   */
  static async startOutboundCall(params: StartCallParams): Promise<string> {
    const prompt = VAPI_SYSTEM_PROMPT
      .replace('{{CUSTOMER_NAME}}', params.customerName)
      .replace('{{JOB_TYPE}}', params.jobType)
      .replace('{{CALL_REASON}}', params.callReason)
      .replace('{{TIME_SLOTS}}', params.availableTimeSlots);

    try {
      const response = await fetch(`${VAPI_API_URL}/call/phone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: params.phoneNumber,
          assistant: {
            model: {
              provider: "openai",
              model: "gpt-4",
              messages: [{ role: "system", content: prompt }]
            },
            voice: "jennifer-playht",
            firstMessage: `G'day ${params.customerName}, this is ArcticFlow calling regarding your ${params.jobType} request. Am I speaking with the right person?`
          },
          metadata: {
            bookingId: params.bookingId,
            customerName: params.customerName,
            reason: params.callReason
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'VAPI Request Failed');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('CallService Error:', error);
      throw error;
    }
  }

  /**
   * TASK 4: Handles VAPI Webhook logic
   * In a real app, this would be a server-side route.
   */
  static async handleVapiWebhook(payload: any): Promise<OutboundCall | null> {
    // 1. Verify event type
    if (payload.type !== 'call.completed') return null;

    const { call } = payload;
    const { metadata, analysis } = call;

    // 2. Extract structured JSON result from AI analysis
    let structuredResult = {
      booking_confirmed: false,
      selected_time: null,
      urgency: 'low',
      notes: ''
    };

    try {
      if (analysis?.structuredData) {
        structuredResult = analysis.structuredData;
      } else if (analysis?.summary) {
        // Fallback or additional logging
        console.log('Call Summary:', analysis.summary);
      }
    } catch (e) {
      console.error('Failed to parse AI structured output', e);
    }

    // 3. Normalize return object
    const outboundCall: OutboundCall = {
      id: call.id,
      bookingId: metadata?.bookingId,
      phoneNumber: call.customer?.number || 'Unknown',
      customerName: metadata?.customerName || 'Client',
      status: 'completed',
      result: structuredResult as any,
      createdAt: new Date().toISOString()
    };

    return outboundCall;
  }
}
