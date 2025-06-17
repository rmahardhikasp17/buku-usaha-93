
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const SisaPendapatan = ({ businessData, updateBusinessData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sisaPendapatan, setSisaPendapatan] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!sisaPendapatan) {
      alert('Mohon isi semua field');
      return;
    }

    const monthYear = format(selectedDate, 'yyyy-MM');
    const recordId = `${monthYear}-${Date.now()}`;
    
    const newRecord = {
      id: recordId,
      monthYear,
      sisaPendapatan: parseFloat(sisaPendapatan),
      createdAt: new Date().toISOString()
    };

    // Save to business data
    const updatedData = {
      ...businessData,
      sisaPendapatanRecords: {
        ...businessData.sisaPendapatanRecords,
        [recordId]: newRecord
      }
    };

    updateBusinessData(updatedData);

    // Export to Excel/CSV
    exportToExcel([newRecord]);

    // Reset form
    setSisaPendapatan('');
    setSelectedDate(new Date());
    
    alert('Data berhasil disimpan!');
  };

  const exportToExcel = (data) => {
    const headers = ['Bulan & Tahun', 'Sisa Pendapatan + Tabungan'];
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        format(new Date(record.monthYear + '-01'), 'MMMM yyyy'),
        record.sisaPendapatan
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'Sisa_Pendapatan.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sisa Pendapatan</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Sisa Pendapatan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="monthYear">Bulan & Tahun</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'Pilih bulan & tahun'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sisaPendapatan">Sisa Pendapatan + Tabungan</Label>
                <Input
                  id="sisaPendapatan"
                  type="number"
                  value={sisaPendapatan}
                  onChange={(e) => setSisaPendapatan(e.target.value)}
                  placeholder="Masukkan nominal"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="flex items-center space-x-2">
                <Save size={16} />
                <span>Simpan</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Display existing records */}
      {businessData.sisaPendapatanRecords && Object.keys(businessData.sisaPendapatanRecords).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Sisa Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Bulan & Tahun</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Sisa Pendapatan + Tabungan</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(businessData.sisaPendapatanRecords)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(record => (
                      <tr key={record.id}>
                        <td className="border border-gray-300 px-4 py-2">
                          {format(new Date(record.monthYear + '-01'), 'MMMM yyyy')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          Rp {record.sisaPendapatan.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SisaPendapatan;
