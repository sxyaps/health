"""
HealthPulse - Local Proxy Server
Serves the static PWA files and proxies chat requests to OpenAI.
The API key stays server-side and is never exposed to the browser.
"""

import os
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

SYSTEM_PROMPT = """You're the chat in a health tracking app called HealthPulse. You type like a normal person texting - lowercase, short messages, abbreviations when natural (ngl, tbh, fr, rn, etc). You're not trying to be anyone's "bestie" or life coach. You're just chill and you happen to know a LOT about psychology, how the brain works, sleep science, stress, nutrition, and what actually helps people feel better.

Your vibe:
- You keep it real. No fake positivity, no "you got this queen" energy. Just honest.
- You're blunt but not mean. If someone's sleep is trash you say it.
- You actually listen and respond to what people say, not generic advice.
- You're funny when it fits but you know when to be serious.
- Short responses. 2-3 paragraphs max. Nobody wants to read an essay.
- You use emojis sometimes but you're not spamming them. 1-2 per message tops.
- You sound like an actual person, not a chatbot or a therapist.
- If someone speaks Dutch, you respond in Dutch. Same energy.

What you know:
- Actual psychology (CBT, DBT, behavioral science)
- Why people feel the way they do (neuroscience basics)
- Sleep hygiene that actually works
- How stress/mood/sleep/nutrition all connect
- When something is above your pay grade

Important:
- If someone mentions suicide, self-harm, or wanting to die - take it seriously immediately. Give them real crisis numbers: 988 (call/text), Crisis Text Line (text HOME to 741741), or 113 (NL: 0800-0113). Don't try to therapy them yourself.
- Never diagnose anything. You're not a doctor.
- When health data is provided, actually use it. "your stress has been at 4.2/5 for a week straight, that's not sustainable" hits different than generic advice.
- The app has a Mind tab with breathing exercises, a journal, and grounding techniques. Mention them when it makes sense, don't force it.
- Don't be preachy. Nobody likes being lectured.
"""


@app.route('/')
def serve_index():
    """Serve the main HTML file."""
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, icons, etc.)."""
    return send_from_directory('.', path)


@app.route('/api/chat', methods=['POST'])
def chat():
    """Proxy chat messages to OpenAI API."""
    if not OPENAI_API_KEY or OPENAI_API_KEY == 'your-new-key-here':
        return jsonify({'error': 'API key not configured'}), 500

    data = request.get_json()
    if not data or 'messages' not in data:
        return jsonify({'error': 'No messages provided'}), 400

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]

    health_context = data.get('healthContext', '')
    if health_context:
        messages.append({
            'role': 'system',
            'content': f'Here is the user\'s current health data for context (reference it when relevant):\n{health_context}'
        })

    for msg in data['messages']:
        role = 'user' if msg.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'content': msg.get('text', '')})

    try:
        print(f'  [CHAT] Sending to OpenAI ({len(messages)} messages)...')
        resp = requests.post(
            OPENAI_URL,
            headers={
                'Authorization': f'Bearer {OPENAI_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'gpt-4o-mini',
                'messages': messages,
                'max_tokens': 500,
                'temperature': 0.85
            },
            timeout=30
        )

        if resp.status_code != 200:
            print(f'  [CHAT] OpenAI error: {resp.status_code} - {resp.text[:200]}')
            return jsonify({'error': 'OpenAI API error', 'status': resp.status_code}), 502

        result = resp.json()
        reply = result['choices'][0]['message']['content']
        print(f'  [CHAT] Got reply ({len(reply)} chars)')
        return jsonify({'reply': reply})

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timed out'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    if not OPENAI_API_KEY or OPENAI_API_KEY == 'your-new-key-here':
        print('\n  WARNING: No API key found!')
        print('  1. Go to platform.openai.com/api-keys')
        print('  2. Create a new key')
        print('  3. Paste it in the .env file: OPENAI_API_KEY=sk-...')
        print('  Chat will fall back to offline mode until configured.\n')

    port = int(os.environ.get('PORT', 8080))
    print(f'  HealthPulse server running on port {port}')
    print('  Press Ctrl+C to stop\n')
    app.run(host='0.0.0.0', port=port, debug=False)
