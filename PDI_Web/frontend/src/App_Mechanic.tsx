import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Varsayılan API adresi. 
const host = window.location.hostname;
const API_BASE_URL = `http://${host}:8000/api/mechanic`;

function App_Mechanic() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    arac_tipi: 'Tourismo',
    is_emri_no: '',
    bb_no: '',
    sasi_no: '',
    alt_grup: 'Boya',
    tespitler: '',
    hata_nerede: 'TUM',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [aracTipleri, setAracTipleri] = useState<any[]>([]);
  const [altGruplar, setAltGruplar] = useState<any[]>([]);
  const [hataNeredeList, setHataNeredeList] = useState<any[]>([]);

  useEffect(() => {
    // Fetch dynamic options
    const fetchOptions = async () => {
      try {
        const [resArac, resAlt, resNerede] = await Promise.all([
          axios.get(`http://${host}:8000/api/admin/lookups/arac-tipi`),
          axios.get(`http://${host}:8000/api/admin/lookups/alt-grup`),
          axios.get(`http://${host}:8000/api/admin/lookups/hata-nerede`),
        ]);
        setAracTipleri(resArac.data);
        setAltGruplar(resAlt.data);
        setHataNeredeList(resNerede.data);
      } catch (err) {
        console.error("Lookup fetch error:", err);
      }
    };
    fetchOptions();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setPhoto(selectedFile);
      setPhotoPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.sasi_no) {
      setMessage({ text: 'Lütfen Şasi No giriniz.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const uploadData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        uploadData.append(key, value);
      });

      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
      uploadData.append('tarih_saat', formattedDate);

      if (photo) {
        uploadData.append('photo', photo);
      }

      console.log("Gönderiliyor:", API_BASE_URL);
      const response = await axios.post(`${API_BASE_URL}/kayit`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ text: 'Kayıt başarıyla oluşturuldu! (Kayıt No: ' + response.data.id + ')', type: 'success' });

      setFormData({
        arac_tipi: 'Tourismo',
        is_emri_no: '',
        bb_no: '',
        sasi_no: '',
        alt_grup: 'Boya',
        tespitler: '',
        hata_nerede: 'TUM',
      });
      setPhoto(null);
      setPhotoPreview(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      console.error("Hata ayrıntısı:", error);
      const errorMsg = error.response?.data?.detail || `Bağlantı hatası: API (${API_BASE_URL}) çalışıyor mu?`;
      setMessage({ text: errorMsg, type: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header" style={{ backgroundColor: '#000', color: '#fff', padding: '15px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Daimler Truck - PDI</h1>
          <small>Mekanik Saha Girişi (Beta v1.0.2)</small>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ backgroundColor: 'transparent', border: '1px solid #fff', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Geri Dön
        </button>
      </div>

      <div className="form-container" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 8px 8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        {message && (
          <div style={{
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Araç Tipi *</label>
            <select name="arac_tipi" value={formData.arac_tipi} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required aria-label="Araç Tipi">
              {aracTipleri.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              {aracTipleri.length === 0 && (
                <>
                  <option value="Tourismo">Tourismo</option>
                  <option value="Conecto">Conecto</option>
                  <option value="Travego">Travego</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>İş Emri No</label>
            <input type="text" name="is_emri_no" value={formData.is_emri_no} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} placeholder="6 hane" aria-label="İş Emri No" />
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Şasi No *</label>
            <input type="text" name="sasi_no" value={formData.sasi_no} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} placeholder="Son 6 hane" required aria-label="Şasi No" />
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Alt Grup *</label>
            <select name="alt_grup" value={formData.alt_grup} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required aria-label="Alt Grup">
              {altGruplar.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              {altGruplar.length === 0 && (
                <>
                  <option value="Boya">Boya</option>
                  <option value="Süsleme">Süsleme</option>
                  <option value="Mekanik">Mekanik</option>
                  <option value="Elektrik">Elektrik</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Fotoğraf Çek / Yükle</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} aria-label="Fotoğraf Çek veya Yükle" />
            {photoPreview && <img src={photoPreview} alt="Önizleme" style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '4px' }} />}
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Hata Nerede Giderildi? *</label>
            <select name="hata_nerede" value={formData.hata_nerede} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} required aria-label="Hata Nerede Giderildi">
              {hataNeredeList.map(n => <option key={n.id} value={n.name}>{n.name === 'TUM' ? 'PDI Sahası (Normal)' : n.name}</option>)}
              {hataNeredeList.length === 0 && (
                <>
                  <option value="TUM">PDI Sahası (Normal)</option>
                  <option value="İmalat">İmalat Hattı</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Tespitler</label>
            <textarea name="tespitler" value={formData.tespitler} onChange={handleInputChange} className="form-control" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} rows={4} placeholder="Notlarınızı buraya yazın..." aria-label="Tespitler"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}>
            {isSubmitting ? 'KAYDEDİLİYOR...' : 'KAYDET VE GÖNDER'}
          </button>

        </form>
      </div>
    </div>
  );
}

export default App_Mechanic;
