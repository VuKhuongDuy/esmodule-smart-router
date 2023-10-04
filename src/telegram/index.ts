import Wei from '@synthetixio/wei';
import axios from 'axios';
import { TELEGRAM_CHATID, TELEGRAM_TOKEN } from '../constants/constants.js';

export const sendMessage = async (message: string) => {
  const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHATID,
    text: message,
  })

  return response
};

export const getChatId = async () => {
    // Send a message on new bot, then run this url
    const updated = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`)
  return updated.data.result[0].message.chat.id
}

export const notifyCreateOrder = async (pair: string, profitDaily: Wei, totalFee: Wei, vol: number) => {
    sendMessage(`Prepare create position on ${pair} with \tprofit daily: ${parseFloat(profitDaily.toString()).toFixed(3)}$, total fee: ${parseFloat(totalFee.toString()).toFixed(3)}$, volume: ${parseFloat(vol.toString()).toFixed(0)}$`)
}

export const notifyCloseOrder = async (pair: string, profitDaily: Wei, totalFee: Wei, vol: number) => {
    sendMessage(`Close position off pair ${pair} on `)
}