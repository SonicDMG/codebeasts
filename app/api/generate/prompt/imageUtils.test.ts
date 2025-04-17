/* eslint-env jest */
/* global jest, describe, it, expect, Buffer, process */
process.env.EVERART_API_KEY = 'test-key';

// Default mocks for OpenAI and EverArt
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            { message: { content: 'Short brown hair, glasses, blue shirt.' } }
          ]
        })
      }
    }
  }));
});

jest.mock('everart', () => {
  return jest.fn().mockImplementation(() => ({
    v1: {
      generations: {
        create: jest.fn().mockResolvedValue([{ id: '123' }]),
        fetchWithPolling: jest.fn().mockResolvedValue({ image_url: 'http://image.url/test.png' })
      }
    }
  }));
});

import { bufferToDataURI } from './imageUtils';

// Pure function test for bufferToDataURI
describe('bufferToDataURI', () => {
  it('converts buffer and mime type to data URI', () => {
    const buffer = Buffer.from('hello world');
    const mimeType = 'image/png';
    const dataUri = bufferToDataURI(buffer, mimeType);
    expect(dataUri).toMatch(/^data:image\/png;base64,/);
    expect(dataUri).toContain(Buffer.from('hello world').toString('base64'));
  });
}); 