import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export default function BasicDateTimePicker() {
  return (
    <div>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker label="Basic date time picker" />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker label="Basic date time picker" />
      </LocalizationProvider>
    </div>
  );
}
