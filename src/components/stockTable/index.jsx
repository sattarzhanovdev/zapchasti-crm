import React from 'react';
import c from './workers.module.scss';
import { Icons } from '../../assets/icons';
import { API } from '../../api';
import { Components } from '..';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import Roboto_normal from './Roboto.ttf'

const STOCK_API = 'http://127.0.0.1:8000';

const StockTable = () => {
  const [month, setMonth] = React.useState('');
  const [clients, setClients] = React.useState(null);
  const [active, setActive] = React.useState(false);
  const [editActive, setEditActive] = React.useState(false);
  const [selectedWeek, setSelectedWeek] = React.useState(5);
  const [categories, setCategories] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState('');

  const currentDate = new Date();

  React.useEffect(() => {
    const monthName = currentDate.toLocaleString('ru', { month: 'long' });
    setMonth(monthName.charAt(0).toUpperCase() + monthName.slice(1));

    fetch(`${STOCK_API}/clients/stocks/`)
      .then(res => res.json())
      .then(data => setClients(data.reverse()))
      .catch(err => console.error('Ошибка загрузки товаров:', err));
  }, []);

  React.useEffect(() => {
    fetch(`${STOCK_API}/clients/categories/`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Ошибка загрузки категорий:', err));
  }, []);

  const getWeekNumber = (dateStr) => {
    const day = new Date(dateStr).getDate();
    if (day >= 1 && day <= 7) return 1;
    if (day >= 8 && day <= 14) return 2;
    if (day >= 15 && day <= 21) return 3;
    if (day >= 22) return 4;
    return null;
  };

  const filterGoods = () => {
    let filtered = clients;
    if (selectedWeek !== 5) {
      filtered = filtered?.filter(item =>
        getWeekNumber(item.appointment_date) === selectedWeek
      );
    }
    if (selectedCategory) {
      filtered = filtered?.filter(item => item.category === selectedCategory);
    }
    return filtered;
  };

const handleExportPDF = () => {
  const filtered = filterGoods();
  if (!filtered || filtered.length === 0) return;

  let content = `Накладная за ${month}\n\n`;

  filtered.forEach((item, index) => {
    const sum = item.price;
    content += `${index + 1}. ${item.name} — ${sum} сом\n`;
  });

  const total = filtered.reduce((sum, item) => sum + item.price * item.fixed_quantity, 0);
  content += `\nИтого: ${total} сом`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Накладная_${month}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
};

  return (
    <div className={c.workers}>
      <button onClick={handleExportPDF} style={{ marginTop: 20 }}>
        Сохранить в PDF
      </button>
      <div className={c.table}>
        <select
          className={c.filteration}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">‒ Все категории ‒</option>
          {categories && categories.map(item => (
            <option key={item.id} value={item.name}>{item.name}</option>
          ))}
        </select>

        <table>
          <thead>
            <tr>
              <th>_</th>
              <th>{filterGoods()?.length || 0} позиций</th>
              <th></th>
              <th>{filterGoods()?.reduce((a, b) => Number(a) + Number(b.fixed_quantity), 0)}</th>
              <th>{filterGoods()?.reduce((a, b) => Number(a) + Number(b.quantity), 0)}</th>
              <th>{filterGoods()?.reduce((a, b) => Number(a) + Number(b.price_seller * b.fixed_quantity), 0)} сом</th>
              <th>{filterGoods()?.reduce((a, b) => Number(a) + Number(b.price * b.fixed_quantity), 0)} сом</th>
              <th></th>
              <th></th>
            </tr>
            <tr>
              <th><img src={Icons.edit} alt="edit" /></th>
              <th>№</th>
              <th>Наименование</th>
              <th>Было добавлено</th>
              <th>Осталось</th>
              <th>Цена поставщика</th>
              <th>Цена продажи</th>
              <th>Штрих-код</th>
              <th>
                <button onClick={() => setActive(true)}>+ Добавить</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filterGoods()?.length > 0 ? (
              filterGoods().map((item, i) => (
                <tr key={item.id}
                    style={
                      Number(item.quantity) <= 30
                        ? { background: 'rgba(255, 0, 0, 0.3)' }
                        : Number(item.quantity) <= 50
                        ? { background: 'rgba(255, 255, 0, 0.3)' }
                        : {}
                    }>
                  <td>
                    <img
                      src={Icons.edit}
                      alt="edit"
                      onClick={() => {
                        localStorage.setItem('editStock', JSON.stringify(item));
                        setEditActive(true);
                      }}
                    />
                  </td>
                  <td>{i + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.fixed_quantity}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price_seller}</td>
                  <td>{item.price}</td>
                  <td>
                    <Barcode
                      value={item.code.split(',')[0]}
                      width={0.6}
                      height={20}
                      fontSize={12}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>Товаров нет</td>
              </tr>
            )}
          </tbody>
        </table>

        
      </div>

      {editActive && <Components.EditStock setActive={setEditActive} selectedBranch="belovodskiy" />}
      {active && <Components.AddStock setActive={setActive} selectedBranch="belovodskiy" />}
    </div>
  );
};

export default StockTable;