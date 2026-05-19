import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export function CompanyPhoneField({ value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
        Phone number
      </label>
      <PhoneInput
        country={'ca'}
        value={value || ''}
        onChange={(phone) => onChange(phone)}
        enableSearch
        searchPlaceholder="Search country..."
        countryCodeEditable={false}
        inputStyle={{ width: '100%', height: 44, fontSize: 15, paddingLeft: 58, border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'inherit', color: '#0F172A' }}
        buttonStyle={{ border: '1px solid #cbd5e1', borderRadius: '8px 0 0 8px', background: 'white', height: 44 }}
        dropdownStyle={{ width: '320px', maxHeight: '280px', fontFamily: 'inherit', zIndex: 200 }}
        searchStyle={{ width: 'calc(100% - 16px)', padding: '8px 12px', margin: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        containerStyle={{ width: '100%' }}
      />
    </div>
  );
}
