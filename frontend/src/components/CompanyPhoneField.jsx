import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export function CompanyPhoneField({ value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
        Phone number
      </label>
      <PhoneInput
        international
        defaultCountry="CA"
        countryCallingCodeEditable={false}
        value={value}
        onChange={onChange}
        className="novala-phone-input"
        placeholder="(780) 555-0123"
      />
    </div>
  );
}
