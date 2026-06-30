import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from './api';

const labels = {
  en: {
    title: 'Visitor Registration',
    subtitle: 'IIM Lucknow — Complete your pre-registration',
    visitDetails: 'Visit Details',
    host: 'Host',
    campus: 'Campus',
    purpose: 'Purpose',
    idProof: 'ID Proof Type',
    idNumber: 'ID Number',
    vehicle: 'Vehicle Number (optional)',
    sendOtp: 'Send OTP',
    otp: 'Enter OTP',
    consent: 'I consent to IIM Lucknow collecting and processing my personal data for this visit, in accordance with the Digital Personal Data Protection Act, 2023. My data will be retained only for the required period and then purged.',
    submit: 'Complete Registration',
    success: 'Registration complete! Show your QR at the gate.',
    hindi: 'हिंदी',
  },
  hi: {
    title: 'आगंतुक पंजीकरण',
    subtitle: 'IIM Lucknow — अपना पूर्व-पंजीकरण पूरा करें',
    visitDetails: 'यात्रा विवरण',
    host: 'मेज़बान',
    campus: 'परिसर',
    purpose: 'उद्देश्य',
    idProof: 'पहचान पत्र प्रकार',
    idNumber: 'पहचान संख्या',
    vehicle: 'वाहन संख्या (वैकल्पिक)',
    sendOtp: 'OTP भेजें',
    otp: 'OTP दर्ज करें',
    consent: 'मैं DPDP अधिनियम 2023 के अनुसार इस यात्रा के लिए अपने व्यक्तिगत डेटा के संग्रह और प्रसंस्करण के लिए सहमति देता/देती हूं।',
    submit: 'पंजीकरण पूरा करें',
    success: 'पंजीकरण पूर्ण! गेट पर अपना QR दिखाएं।',
    hindi: 'English',
  },
};

export default function RegistrationPage() {
  const { token } = useParams<{ token: string }>();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = labels[lang];
  const [visit, setVisit] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [form, setForm] = useState({
    idProofType: 'aadhaar', idProofNumber: '', otp: '', vehicleNumber: '', consentGiven: false,
  });

  useEffect(() => {
    if (token) {
      publicApi<Record<string, unknown>>(`/public/visit/${token}`).then(setVisit).catch((e) => setError(e.message));
    }
  }, [token]);

  const sendOtp = async () => {
    const phone = visit?.visitorPhone as string;
    const res = await publicApi<{ devOtp?: string }>('/public/otp/send', {
      method: 'POST', body: JSON.stringify({ phone }),
    });
    setOtpSent(true);
    if (res.devOtp) setDevOtp(res.devOtp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentGiven) { setError('Consent is required'); return; }
    try {
      await publicApi(`/public/register/${token}`, {
        method: 'POST',
        body: JSON.stringify({
          phone: visit?.visitorPhone,
          ...form,
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (error && !visit) {
    return <div className="header"><h1>{error}</h1></div>;
  }

  if (!visit) return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;

  if (success || visit.alreadyRegistered) {
    return (
      <>
        <div className="header"><h1>IIM Lucknow VMS</h1></div>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div className="alert alert-success" style={{ maxWidth: 400, margin: '0 auto' }}>{t.success}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="header" style={{ position: 'relative' }}>
        <div className="lang-toggle">
          <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>{t.hindi}</button>
        </div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div style={{ padding: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{t.visitDetails}</h3>
          <p><strong>{visit.visitorName as string}</strong> — {visit.visitorPhone as string}</p>
          <p>{t.host}: {visit.host as string}</p>
          <p>{t.campus}: {visit.campus as string}</p>
          <p>{t.purpose}: {visit.purpose as string}</p>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t.idProof}</label>
              <select value={form.idProofType} onChange={(e) => setForm({ ...form, idProofType: e.target.value })}>
                <option value="aadhaar">Aadhaar</option>
                <option value="dl">Driving License</option>
                <option value="passport">Passport</option>
                <option value="voter_id">Voter ID</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t.idNumber}</label>
              <input required value={form.idProofNumber} onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t.vehicle}</label>
              <input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
            </div>

            {!otpSent ? (
              <button type="button" className="btn btn-primary" onClick={sendOtp}>{t.sendOtp}</button>
            ) : (
              <>
                <div className="form-group">
                  <label>{t.otp}</label>
                  <input required value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} maxLength={6} />
                  {devOtp && <small style={{ color: 'var(--text-muted)' }}>Dev OTP: {devOtp}</small>}
                </div>
                <div className="consent-box">
                  <label>
                    <input type="checkbox" checked={form.consentGiven} onChange={(e) => setForm({ ...form, consentGiven: e.target.checked })} />
                    {' '}{t.consent}
                  </label>
                </div>
                <button type="submit" className="btn btn-primary">{t.submit}</button>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
