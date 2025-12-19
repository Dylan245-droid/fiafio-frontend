import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Copy, Check, Key, Webhook, 
  TestTube, ArrowRight, Terminal, ChevronRight,
  Zap, Shield, Globe, Send, CreditCard, AlertTriangle
} from 'lucide-react';

type Language = 'javascript' | 'python' | 'php' | 'curl';
type Section = 'overview' | 'authentication' | 'checkout' | 'payment_request' | 'webhooks' | 'testing';

const codeExamples: Record<string, Record<Language, string>> = {
  createCheckout: {
    javascript: `// Créer une session de paiement
const response = await fetch('https://api.fiafio.com/api/v1/checkout/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_xxxxxxxxxxxx'
  },
  body: JSON.stringify({
    amount: 5000,
    currency: 'XAF',
    description: 'Achat produit #123',
    success_url: 'https://votresite.com/success',
    cancel_url: 'https://votresite.com/cancel',
    webhook_url: 'https://votresite.com/webhook',
    metadata: { order_id: '123' }
  })
});

const data = await response.json();
const checkoutUrl = data.session.checkout_url;

// Redirigez l'utilisateur vers checkoutUrl
window.location.href = checkoutUrl;`,

    python: `import requests

response = requests.post(
    'https://api.fiafio.com/api/v1/checkout/sessions',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'sk_live_xxxxxxxxxxxx'
    },
    json={
        'amount': 5000,
        'currency': 'XAF',
        'description': 'Achat produit #123',
        'success_url': 'https://votresite.com/success',
        'cancel_url': 'https://votresite.com/cancel',
        'webhook_url': 'https://votresite.com/webhook',
        'metadata': {'order_id': '123'}
    }
)

data = response.json()
checkout_url = data['session']['checkout_url']

# Redirigez l'utilisateur vers checkout_url`,

    php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.fiafio.com/api/v1/checkout/sessions',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: sk_live_xxxxxxxxxxxx'
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'amount' => 5000,
        'currency' => 'XAF',
        'description' => 'Achat produit #123',
        'success_url' => 'https://votresite.com/success',
        'cancel_url' => 'https://votresite.com/cancel',
        'webhook_url' => 'https://votresite.com/webhook',
        'metadata' => ['order_id' => '123']
    ])
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

$checkoutUrl = $data['session']['checkout_url'];
// Redirigez l'utilisateur vers $checkoutUrl`,

    curl: `curl -X POST https://api.fiafio.com/api/v1/checkout/sessions \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_xxxxxxxxxxxx" \\
  -d '{
    "amount": 5000,
    "currency": "XAF",
    "description": "Achat produit #123",
    "success_url": "https://votresite.com/success",
    "cancel_url": "https://votresite.com/cancel",
    "webhook_url": "https://votresite.com/webhook",
    "metadata": { "order_id": "123" }
  }'`,
  },

  webhook: {
    javascript: `// Express.js - Webhook handler
const crypto = require('crypto');

app.post('/webhook/fiafio', express.json(), (req, res) => {
  // 1. Vérifier la signature (recommandé en production)
  const signature = req.headers['x-fiafio-signature'];
  const webhookSecret = process.env.FIAFIO_WEBHOOK_SECRET;
  
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Traiter l'événement
  const { event, data } = req.body;
  
  switch (event) {
    case 'checkout.completed':
      console.log('Paiement réussi:', data.sessionId);
      // Mettre à jour votre commande comme payée
      break;
      
    case 'payment_request.approved':
      console.log('Demande approuvée:', data.id);
      // Le client a accepté la demande de paiement
      break;
      
    case 'payment_request.rejected':
      console.log('Demande refusée:', data.id);
      break;
  }
  
  // 3. Toujours répondre 200 OK
  res.status(200).json({ received: true });
});`,

    python: `# Flask - Webhook handler
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook/fiafio', methods=['POST'])
def handle_webhook():
    # 1. Vérifier la signature (recommandé en production)
    signature = request.headers.get('X-Fiafio-Signature')
    webhook_secret = os.environ.get('FIAFIO_WEBHOOK_SECRET')
    
    expected_sig = 'sha256=' + hmac.new(
        webhook_secret.encode(),
        request.data,
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_sig:
        return jsonify({'error': 'Invalid signature'}), 401
    
    # 2. Traiter l'événement
    payload = request.json
    event = payload.get('event')
    data = payload.get('data')
    
    if event == 'checkout.completed':
        print(f"Paiement réussi: {data['sessionId']}")
        # Mettre à jour votre commande comme payée
        
    elif event == 'payment_request.approved':
        print(f"Demande approuvée: {data['id']}")
        
    elif event == 'payment_request.rejected':
        print(f"Demande refusée: {data['id']}")
    
    # 3. Toujours répondre 200 OK
    return jsonify({'received': True}), 200`,

    php: `<?php
// webhook.php

// 1. Récupérer le payload
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_FIAFIO_SIGNATURE'] ?? '';
$webhookSecret = getenv('FIAFIO_WEBHOOK_SECRET');

// 2. Vérifier la signature (recommandé en production)
$expectedSig = 'sha256=' . hash_hmac('sha256', $payload, $webhookSecret);

if (!hash_equals($expectedSig, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// 3. Traiter l'événement
$data = json_decode($payload, true);
$event = $data['event'];
$eventData = $data['data'];

switch ($event) {
    case 'checkout.completed':
        error_log('Paiement réussi: ' . $eventData['sessionId']);
        // Mettre à jour votre commande comme payée
        break;
        
    case 'payment_request.approved':
        error_log('Demande approuvée: ' . $eventData['id']);
        break;
        
    case 'payment_request.rejected':
        error_log('Demande refusée: ' . $eventData['id']);
        break;
}

// 4. Toujours répondre 200 OK
http_response_code(200);
echo json_encode(['received' => true]);`,

    curl: `# Exemple de payload webhook (envoyé par Fiafio à votre serveur)

# Headers:
# X-Fiafio-Event: checkout.completed
# X-Fiafio-Signature: sha256=abc123...

# Body:
{
  "event": "checkout.completed",
  "data": {
    "sessionId": "cs_abc123xyz",
    "amount": 5000,
    "currency": "XAF",
    "paidAt": "2024-01-15T10:30:00Z",
    "transactionId": "TXN-ABC123",
    "metadata": { "order_id": "123" }
  },
  "timestamp": "2024-01-15T10:30:05Z"
}`,
  },

  paymentRequest: {
    javascript: `// Demander un paiement à un utilisateur Fiafio
const response = await fetch('https://api.fiafio.com/api/v1/payment-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_xxxxxxxxxxxx'
  },
  body: JSON.stringify({
    recipient_id: 'FIA-ABC123',      // ID Fiafio du client
    amount: 5000,
    currency: 'XAF',
    description: 'Paiement facture #456',
    webhook_url: 'https://votresite.com/webhook',
    metadata: { invoice_id: '456' }
  })
});

const data = await response.json();
console.log('Demande créée:', data.payment_request.id);
console.log('Statut:', data.payment_request.status); // 'pending'

// Le client recevra une notification dans son app Fiafio
// et pourra approuver ou refuser le paiement`,

    python: `import requests

response = requests.post(
    'https://api.fiafio.com/api/v1/payment-requests',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'sk_live_xxxxxxxxxxxx'
    },
    json={
        'recipient_id': 'FIA-ABC123',  # ID Fiafio du client
        'amount': 5000,
        'currency': 'XAF',
        'description': 'Paiement facture #456',
        'webhook_url': 'https://votresite.com/webhook',
        'metadata': {'invoice_id': '456'}
    }
)

data = response.json()
print(f"Demande créée: {data['payment_request']['id']}")
print(f"Statut: {data['payment_request']['status']}")  # 'pending'

# Le client recevra une notification dans son app Fiafio`,

    php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.fiafio.com/api/v1/payment-requests',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-API-Key: sk_live_xxxxxxxxxxxx'
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'recipient_id' => 'FIA-ABC123',  // ID Fiafio du client
        'amount' => 5000,
        'currency' => 'XAF',
        'description' => 'Paiement facture #456',
        'webhook_url' => 'https://votresite.com/webhook',
        'metadata' => ['invoice_id' => '456']
    ])
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

echo "Demande créée: " . $data['payment_request']['id'];
echo "Statut: " . $data['payment_request']['status'];  // 'pending'

// Le client recevra une notification dans son app Fiafio`,

    curl: `curl -X POST https://api.fiafio.com/api/v1/payment-requests \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_xxxxxxxxxxxx" \\
  -d '{
    "recipient_id": "FIA-ABC123",
    "amount": 5000,
    "currency": "XAF",
    "description": "Paiement facture #456",
    "webhook_url": "https://votresite.com/webhook",
    "metadata": { "invoice_id": "456" }
  }'`,
  },

  checkStatus: {
    javascript: `// Vérifier le statut d'une demande de paiement
const response = await fetch('https://api.fiafio.com/api/v1/payment-requests/pr_abc123', {
  method: 'GET',
  headers: {
    'X-API-Key': 'sk_live_xxxxxxxxxxxx'
  }
});

const data = await response.json();
console.log('Statut:', data.status); // 'pending', 'approved', 'rejected', 'expired'`,

    python: `import requests

response = requests.get(
    'https://api.fiafio.com/api/v1/payment-requests/pr_abc123',
    headers={
        'X-API-Key': 'sk_live_xxxxxxxxxxxx'
    }
)

data = response.json()
print(f"Statut: {data['status']}")  # 'pending', 'approved', 'rejected', 'expired'`,

    php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.fiafio.com/api/v1/payment-requests/pr_abc123',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: sk_live_xxxxxxxxxxxx'
    ]
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

echo "Statut: " . $data['status'];  // 'pending', 'approved', 'rejected', 'expired'`,

    curl: `curl -X GET https://api.fiafio.com/api/v1/payment-requests/pr_abc123 \\
  -H "X-API-Key: sk_live_xxxxxxxxxxxx"`,
  },

  cancelRequest: {
    javascript: `// Annuler une demande de paiement en attente
const response = await fetch('https://api.fiafio.com/api/v1/payment-requests/pr_abc123/cancel', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_live_xxxxxxxxxxxx'
  }
});

const data = await response.json();
console.log('Annulée:', data.success);`,

    python: `import requests

response = requests.post(
    'https://api.fiafio.com/api/v1/payment-requests/pr_abc123/cancel',
    headers={
        'X-API-Key': 'sk_live_xxxxxxxxxxxx'
    }
)

data = response.json()
print(f"Annulée: {data['success']}")`,

    php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.fiafio.com/api/v1/payment-requests/pr_abc123/cancel',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: sk_live_xxxxxxxxxxxx'
    ]
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

echo "Annulée: " . ($data['success'] ? 'oui' : 'non');`,

    curl: `curl -X POST https://api.fiafio.com/api/v1/payment-requests/pr_abc123/cancel \\
  -H "X-API-Key: sk_live_xxxxxxxxxxxx"`,
  },
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl bg-black/50 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-gray-300 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function LanguageTabs({ 
  selected, 
  onSelect 
}: { 
  selected: Language; 
  onSelect: (lang: Language) => void;
}) {
  const languages: { key: Language; label: string }[] = [
    { key: 'javascript', label: 'JavaScript' },
    { key: 'python', label: 'Python' },
    { key: 'php', label: 'PHP' },
    { key: 'curl', label: 'cURL' },
  ];

  return (
    <div className="flex gap-2 mb-4">
      {languages.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === key
              ? 'bg-primary text-black'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function DeveloperDocs() {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState<Language>('javascript');
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const sections: { key: Section; icon: any; title: string }[] = [
    { key: 'overview', icon: Zap, title: 'Vue d\'ensemble' },
    { key: 'authentication', icon: Key, title: 'Authentification' },
    { key: 'checkout', icon: CreditCard, title: 'Checkout (Paiement)' },
    { key: 'payment_request', icon: Send, title: 'Demandes de paiement' },
    { key: 'webhooks', icon: Webhook, title: 'Webhooks' },
    { key: 'testing', icon: TestTube, title: 'Mode test' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-black font-sans text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour</span>
              </button>
              <div className="hidden sm:block h-6 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <img src="/fiafio_logo.png" alt="Fiafio" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
                <span className="font-bold text-sm sm:text-base">
                  <span className="hidden sm:inline">Documentation </span>API
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="px-3 py-1.5 sm:px-5 sm:py-2 bg-primary text-black rounded-lg font-semibold text-xs sm:text-sm hover:scale-105 transition-transform"
            >
              <span className="sm:hidden">S'inscrire</span>
              <span className="hidden sm:inline">Créer un compte</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {sections.map(({ key, icon: Icon, title }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeSection === key
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{title}</span>
                  {activeSection === key && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Section Tabs */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
              {sections.map(({ key, title }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeSection === key
                      ? 'bg-primary text-black'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">API Fiafio Pay</h1>
                  <p className="text-gray-400 text-lg">
                    Intégrez les paiements Fiafio à votre application en quelques minutes. 
                    Notre API REST vous permet d'accepter les paiements de vos clients de manière simple et sécurisée.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: Zap, title: 'Simple', desc: 'API REST avec JSON, intégration en 10 minutes' },
                    { icon: Shield, title: 'Sécurisé', desc: 'HTTPS obligatoire, signatures webhook' },
                    { icon: Globe, title: 'Temps réel', desc: 'Webhooks instantanés, polling disponible' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-5 rounded-xl bg-white/5 border border-white/10">
                      <Icon className="w-8 h-8 text-primary mb-3" />
                      <h3 className="font-bold text-white mb-1">{title}</h3>
                      <p className="text-gray-500 text-sm">{desc}</p>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-xl bg-primary/10 border border-primary/30">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    Deux méthodes d'intégration
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-black/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <h4 className="font-medium text-white">Checkout (Recommandé)</h4>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        Créez une session de paiement et redirigez l'utilisateur vers notre page de paiement hébergée.
                      </p>
                      <ul className="text-gray-500 text-sm space-y-1">
                        <li>✅ Aucun formulaire à gérer</li>
                        <li>✅ Page de paiement optimisée</li>
                        <li>✅ Idéal pour e-commerce</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg bg-black/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Send className="w-5 h-5 text-primary" />
                        <h4 className="font-medium text-white">Demande de paiement</h4>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        Envoyez une demande de paiement directement à un utilisateur Fiafio. Il approuve depuis son app.
                      </p>
                      <ul className="text-gray-500 text-sm space-y-1">
                        <li>✅ Paiement sans redirection</li>
                        <li>✅ Le client reçoit une notification</li>
                        <li>✅ Idéal pour factures, abonnements</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold text-white mb-3">Base URL</h3>
                  <code className="text-primary bg-black/40 px-3 py-2 rounded-lg text-sm block">
                    https://api.fiafio.com/api/v1
                  </code>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveSection('authentication')}
                    className="px-6 py-3 bg-primary text-black rounded-xl font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    Commencer l'intégration
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Authentication Section */}
            {activeSection === 'authentication' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Authentification</h1>
                  <p className="text-gray-400">
                    Toutes les requêtes API doivent inclure votre clé API secrète dans le header.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <h3 className="font-bold text-white">Clés API</h3>
                  <p className="text-gray-400 text-sm">
                    Vous trouverez vos clés API dans le dashboard marchand après activation de votre compte.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-black/30">
                      <Key className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">Secret Key (sk_)</p>
                        <p className="text-gray-500 text-sm">
                          <span className="text-red-400">⚠️ Ne jamais exposer côté client.</span> Utilisée uniquement côté serveur pour toutes les requêtes API.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Header requis</h3>
                  <CodeBlock
                    language="http"
                    code={`X-API-Key: sk_live_xxxxxxxxxxxx
Content-Type: application/json`}
                  />
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <strong>Sécurité importante:</strong> Ne stockez jamais votre clé secrète dans le code frontend. 
                    Utilisez toujours des variables d'environnement côté serveur.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  <strong>Mode Test:</strong> Utilisez les clés préfixées par <code className="bg-black/30 px-1 rounded">sk_test_</code> pour tester sans effectuer de vraies transactions.
                </div>
              </div>
            )}

            {/* Checkout Section */}
            {activeSection === 'checkout' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Checkout - Créer un paiement</h1>
                  <p className="text-gray-400">
                    Créez une session de checkout et redirigez l'utilisateur vers notre page de paiement sécurisée.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold text-white mb-4">Endpoint</h3>
                  <code className="text-primary bg-black/40 px-3 py-2 rounded-lg text-sm">
                    POST /api/v1/checkout/sessions
                  </code>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Paramètres</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Paramètre</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Requis</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">amount</code></td>
                          <td className="py-3 px-4">number</td>
                          <td className="py-3 px-4">✓</td>
                          <td className="py-3 px-4">Montant en XAF (entier)</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">currency</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4">✓</td>
                          <td className="py-3 px-4">"XAF" (seule devise supportée)</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">description</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">Description affichée au client</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">success_url</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">URL de redirection après paiement réussi</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">cancel_url</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">URL de redirection si annulé</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">webhook_url</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">URL pour recevoir les notifications (recommandé)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4"><code className="text-gray-500">metadata</code></td>
                          <td className="py-3 px-4">object</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">Données personnalisées (retournées dans le webhook)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Exemple de code</h3>
                  <LanguageTabs selected={selectedLang} onSelect={setSelectedLang} />
                  <CodeBlock code={codeExamples.createCheckout[selectedLang]} language={selectedLang} />
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Réponse</h3>
                  <CodeBlock
                    language="json"
                    code={`{
  "session": {
    "id": "cs_abc123xyz",
    "checkout_url": "https://pay.fiafio.com/checkout/cs_abc123xyz",
    "status": "pending",
    "amount": 5000,
    "fee": 100,
    "currency": "XAF",
    "expires_at": "2024-01-15T11:00:00Z"
  }
}`}
                  />
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
                  <strong>Flux de paiement:</strong>
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    <li>Créez une session avec l'API</li>
                    <li>Redirigez l'utilisateur vers <code className="bg-black/30 px-1 rounded">checkout_url</code></li>
                    <li>L'utilisateur paie sur notre page sécurisée</li>
                    <li>Nous envoyons un webhook et redirigeons vers <code className="bg-black/30 px-1 rounded">success_url</code></li>
                  </ol>
                </div>
              </div>
            )}

            {/* Payment Request Section */}
            {activeSection === 'payment_request' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Demandes de paiement</h1>
                  <p className="text-gray-400">
                    Envoyez une demande de paiement directement à un utilisateur Fiafio. 
                    Le client reçoit une notification et peut approuver ou refuser depuis son app.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
                  <strong>💡 Cas d'usage:</strong> Idéal pour les factures récurrentes, abonnements, ou quand vous connaissez l'ID Fiafio de votre client.
                </div>

                {/* Create Payment Request */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold text-white mb-4">Créer une demande</h3>
                  <code className="text-primary bg-black/40 px-3 py-2 rounded-lg text-sm">
                    POST /api/v1/payment-requests
                  </code>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Paramètres</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Paramètre</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Requis</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">recipient_id</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4">✓</td>
                          <td className="py-3 px-4">ID Fiafio du client (ex: FIA-ABC123)</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">amount</code></td>
                          <td className="py-3 px-4">number</td>
                          <td className="py-3 px-4">✓</td>
                          <td className="py-3 px-4">Montant en XAF</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">currency</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">"XAF" par défaut</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-primary">description</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">Description affichée au client</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-3 px-4"><code className="text-gray-500">webhook_url</code></td>
                          <td className="py-3 px-4">string</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">URL pour recevoir les notifications</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4"><code className="text-gray-500">metadata</code></td>
                          <td className="py-3 px-4">object</td>
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4">Données personnalisées</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Exemple de code</h3>
                  <LanguageTabs selected={selectedLang} onSelect={setSelectedLang} />
                  <CodeBlock code={codeExamples.paymentRequest[selectedLang]} language={selectedLang} />
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Réponse</h3>
                  <CodeBlock
                    language="json"
                    code={`{
  "payment_request": {
    "id": "pr_abc123xyz",
    "amount": 5000,
    "currency": "XAF",
    "description": "Paiement facture #456",
    "status": "pending",
    "expires_at": "2024-01-15T10:45:00Z",
    "recipient": {
      "id": "FIA-ABC123",
      "name": "Jean Dupont"
    }
  }
}`}
                  />
                </div>

                {/* Other endpoints */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white mb-2">Vérifier le statut</h4>
                    <code className="text-primary bg-black/40 px-2 py-1 rounded text-xs">
                      GET /api/v1/payment-requests/:id
                    </code>
                    <p className="text-gray-500 text-sm mt-2">
                      Statuts possibles: <code className="text-gray-400">pending</code>, <code className="text-green-400">approved</code>, <code className="text-red-400">rejected</code>, <code className="text-yellow-400">expired</code>
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white mb-2">Annuler une demande</h4>
                    <code className="text-primary bg-black/40 px-2 py-1 rounded text-xs">
                      POST /api/v1/payment-requests/:id/cancel
                    </code>
                    <p className="text-gray-500 text-sm mt-2">
                      Annule une demande en attente. Non disponible si déjà approuvée/rejetée.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold text-white mb-3">Événements webhook</h3>
                  <div className="space-y-2">
                    {[
                      { event: 'payment_request.approved', desc: 'Le client a approuvé le paiement ✅' },
                      { event: 'payment_request.rejected', desc: 'Le client a refusé la demande ❌' },
                      { event: 'payment_request.expired', desc: 'Demande expirée (15 min) ⏰' },
                    ].map(({ event, desc }) => (
                      <div key={event} className="flex items-center gap-4 p-3 rounded-lg bg-black/30">
                        <code className="text-primary text-sm">{event}</code>
                        <span className="text-gray-500 text-sm">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks Section */}
            {activeSection === 'webhooks' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Webhooks</h1>
                  <p className="text-gray-400">
                    Recevez des notifications en temps réel lorsqu'un événement se produit. 
                    C'est la méthode recommandée pour confirmer les paiements.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  <strong>Important:</strong> Ne validez jamais un paiement uniquement depuis le frontend (success_url). 
                  Utilisez toujours les webhooks côté serveur pour confirmer les transactions.
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold text-white mb-4">Événements disponibles</h3>
                  <div className="space-y-3">
                    <div className="font-medium text-primary mb-2">Checkout</div>
                    {[
                      { event: 'checkout.completed', desc: 'Paiement réussi' },
                      { event: 'checkout.failed', desc: 'Paiement échoué' },
                      { event: 'checkout.expired', desc: 'Session expirée (1h)' },
                    ].map(({ event, desc }) => (
                      <div key={event} className="flex items-center gap-4 p-3 rounded-lg bg-black/30">
                        <code className="text-primary text-sm">{event}</code>
                        <span className="text-gray-500 text-sm">{desc}</span>
                      </div>
                    ))}
                    
                    <div className="font-medium text-primary mb-2 mt-4">Demandes de paiement</div>
                    {[
                      { event: 'payment_request.approved', desc: 'Client a approuvé' },
                      { event: 'payment_request.rejected', desc: 'Client a refusé' },
                      { event: 'payment_request.expired', desc: 'Demande expirée (15 min)' },
                    ].map(({ event, desc }) => (
                      <div key={event} className="flex items-center gap-4 p-3 rounded-lg bg-black/30">
                        <code className="text-primary text-sm">{event}</code>
                        <span className="text-gray-500 text-sm">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Headers envoyés</h3>
                  <CodeBlock
                    language="http"
                    code={`X-Fiafio-Event: checkout.completed
X-Fiafio-Signature: sha256=abc123...
Content-Type: application/json`}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-white mb-4">Exemple de handler</h3>
                  <LanguageTabs selected={selectedLang} onSelect={setSelectedLang} />
                  <CodeBlock code={codeExamples.webhook[selectedLang]} language={selectedLang} />
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-bold text-white mb-3">Bonnes pratiques</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Répondez toujours avec un code HTTP 200 rapidement
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Vérifiez la signature pour éviter les requêtes frauduleuses
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Gérez l'idempotence (un même webhook peut être envoyé plusieurs fois)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Les webhooks sont réessayés jusqu'à 3 fois en cas d'échec
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Testing Section */}
            {activeSection === 'testing' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold mb-4">Mode Test</h1>
                  <p className="text-gray-400">
                    Testez votre intégration sans effectuer de vraies transactions.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <h3 className="font-bold text-white">Comment utiliser le mode test</h3>
                  <ol className="text-gray-300 space-y-2 text-sm list-decimal list-inside">
                    <li>Connectez-vous à votre dashboard marchand</li>
                    <li>Activez le toggle "Mode Test" en haut de la page</li>
                    <li>Vos clés de test (<code className="bg-black/30 px-1 rounded">sk_test_...</code>) seront affichées</li>
                    <li>Utilisez ces clés pour toutes vos requêtes de développement</li>
                  </ol>
                </div>

                <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30">
                  <h3 className="font-bold text-white mb-3">Comportement en mode test</h3>
                  <ul className="text-green-300 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Les paiements checkout sont automatiquement marqués comme réussis
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Aucun argent réel n'est transféré
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Les webhooks fonctionnent normalement
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-green-400" />
                      Les transactions test sont visibles dans le dashboard (badge "Test")
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  <strong>Avant de passer en production:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Testez tous les scénarios (succès, échec, expiration)</li>
                    <li>Vérifiez que vos webhooks fonctionnent correctement</li>
                    <li>Remplacez vos clés test par les clés live</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 bg-primary text-black rounded-xl font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    Créer un compte marchand
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
