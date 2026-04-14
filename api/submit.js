// api/submit.js
// Funzione serverless Vercel — riceve le risposte dell'assessment e le invia via email

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const answers = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ status: 'error', message: 'Payload non valido' });
    }

    const timestamp = answers.timestamp || new Date().toLocaleString('it-IT');

    const sections = {
      'Parte I — Cultura finanziaria e mercati (Q1–Q8)': ['q1','q2','q3','q4','q5','q6','q7','q8'],
      'Parte II — Strumenti e veicoli (Q9–Q17)': ['q9','q10','q11','q12','q13','q14','q15','q16','q17'],
      'Parte III — Patrimonio e pianificazione (Q18–Q30)': ['q18','q19','q20','q21','q22','q23','q24','q25','q26','q27','q28','q29','q30'],
      'Parte IV — Governance e strutture (Q31–Q45)': ['q31','q32','q33','q34','q35','q36','q37','q38','q39','q40','q41','q42','q43','q44','q45'],
      'Parte V — Psicologia e comportamento (Q46–Q60)': ['q46','q47','q48','q49','q50','q51','q52','q53','q54','q55','q56','q57','q58','q59','q60'],
      'Parte VI — Passaggio generazionale (Q61–Q72)': ['q61','q62','q63','q64','q65','q66','q67','q68','q69','q70','q71','q72'],
    };

    let reportRows = '';
    for (const [section, qIds] of Object.entries(sections)) {
      reportRows += `
        <tr>
          <td colspan="2" style="background:#250909;color:#FBD9C8;font-family:Georgia,serif;font-size:13px;
            font-style:italic;padding:10px 16px;letter-spacing:0.05em;">
            ${section}
          </td>
        </tr>`;

      for (const qId of qIds) {
        const baseAnswer = answers[qId];
        if (baseAnswer !== undefined) {
          const displayVal = baseAnswer === 'dk' ? '— (Non saprei)' : baseAnswer.toUpperCase();
          reportRows += `
          <tr style="border-bottom:1px solid #ebe4d4;">
            <td style="padding:8px 16px;font-family:Georgia,serif;font-size:13px;
              color:#2d3139;width:80px;font-weight:600;">${qId.toUpperCase()}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;
              color:#2d3139;">${displayVal}</td>
          </tr>`;
        }

        const compositeKeys = Object.keys(answers).filter(k => k.startsWith(qId + '_'));
        if (compositeKeys.length > 0) {
          const parts = compositeKeys.map(k => {
            const subKey = k.replace(qId + '_', '');
            return `${subKey}: <strong>${answers[k]}</strong>`;
          }).join(' &nbsp;|&nbsp; ');
          reportRows += `
          <tr style="border-bottom:1px solid #ebe4d4;">
            <td style="padding:8px 16px;font-family:Georgia,serif;font-size:13px;
              color:#2d3139;width:80px;font-weight:600;">${qId.toUpperCase()}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;
              color:#2d3139;">${parts}</td>
          </tr>`;
        }
      }
    }

    const totalAnswered = Object.keys(answers).filter(k => k.startsWith('q')).length;

    const emailHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>PMI Assessment — Risultati</title></head>
<body style="margin:0;padding:0;background:#f5f0e6;font-family:Arial,sans-serif;">
  <div style="max-width:680px;margin:40px auto;background:white;border:1px solid #d8d2c5;">
    <div style="background:#250909;padding:36px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.25em;
        text-transform:uppercase;color:rgba(251,217,200,0.6);margin-bottom:12px;">
        Multi Family Office
      </div>
      <div style="font-family:Georgia,serif;font-size:28px;font-style:italic;
        color:#FBD9C8;line-height:1.2;">
        Patrimonial Maturity Index
      </div>
      <div style="width:40px;height:1px;background:rgba(251,217,200,0.3);margin:16px auto;"></div>
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.15em;
        text-transform:uppercase;color:rgba(251,217,200,0.5);">
        Report riservato — Cuniberti &amp; Partners
      </div>
    </div>
    <div style="padding:24px 40px;background:#faf7f2;border-bottom:1px solid #ebe4d4;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;
            color:#9a7e4f;font-family:Arial,sans-serif;padding:4px 0;">Data compilazione</td>
          <td style="font-size:13px;color:#2d3139;font-family:Georgia,serif;
            text-align:right;padding:4px 0;">${timestamp}</td>
        </tr>
        <tr>
          <td style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;
            color:#9a7e4f;font-family:Arial,sans-serif;padding:4px 0;">Risposte raccolte</td>
          <td style="font-size:13px;color:#2d3139;font-family:Georgia,serif;
            text-align:right;padding:4px 0;">${totalAnswered} campi</td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-family:Georgia,serif;font-size:15px;font-style:italic;
        color:#2d3139;margin:0 0 24px;">
        Di seguito il dettaglio completo delle risposte fornite dal candidato.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ebe4d4;">
        ${reportRows}
      </table>
    </div>
    <div style="background:#0f1e36;padding:24px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.15em;
        text-transform:uppercase;color:rgba(235,228,212,0.5);">
        Cuniberti &amp; Partners · Multi Family Office · Torino
      </div>
    </div>
  </div>
</body>
</html>`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Assessment PMI <onboarding@resend.dev>',
        to: ['andrebolo2000@gmail.com'],
        subject: `[PMI] Nuovo assessment ricevuto — ${timestamp}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error('Resend error:', errorBody);
      return res.status(200).json({ status: 'ok' });
    }

    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(200).json({ status: 'ok' });
  }
}
