# python-service/test_groq.py
import httpx
import json
import asyncio

GROQ_API_KEY = "gsk_your-actual-key-here"  # Replace with your key

async def test_groq():
    print("🧪 Testing Groq API...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "user", "content": "Say 'Hello from Groq!' in one word"}
                ],
                "max_tokens": 50
            }
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Response: {result['choices'][0]['message']['content']}")
        else:
            print(f"❌ Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_groq())