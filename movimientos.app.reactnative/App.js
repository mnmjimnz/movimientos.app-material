import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDb, addMovimiento, getPendingCount, getPendingMovimientos, deleteAllPendingMovimientos, getCategorias, getSubcategorias, getMetodosPago, saveCategorias, saveMetodosPago, deleteAllServerMovimientos, getAllMovimientos } from './src/database';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [tab, setTab] = useState('form'); // form, list, settings
  const [url, setUrl] = useState('');
  
  // Form State
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('0'); // 0 Egreso, 1 Ingreso
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [idCategoria, setIdCategoria] = useState('');
  const [idSubcategoria, setIdSubcategoria] = useState('');
  const [idMetodopago, setIdMetodopago] = useState('');

  // Catalogs
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [metodos, setMetodos] = useState([]);

  // List State
  const [movimientos, setMovimientos] = useState([]);
  
  // Sync State
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [selectedMov, setSelectedMov] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function setup() {
      await initDb();
      const savedUrl = await AsyncStorage.getItem('serverUrl');
      if (savedUrl) setUrl(savedUrl);
      await loadCatalogs();
      await refreshData();
    }
    setup();
  }, []);

  useEffect(() => {
    if (idCategoria) {
      loadSubcategorias(idCategoria);
    } else {
      setSubcategorias([]);
    }
  }, [idCategoria]);

  const loadCatalogs = async () => {
    const cats = await getCategorias();
    setCategorias(cats);
    if (cats.length > 0 && !idCategoria) setIdCategoria(cats[0].id.toString());
    
    const mets = await getMetodosPago();
    setMetodos(mets);
    if (mets.length > 0 && !idMetodopago) setIdMetodopago(mets[0].id.toString());
  };

  const loadSubcategorias = async (idPadre) => {
    const subcats = await getSubcategorias(idPadre);
    setSubcategorias(subcats);
    if (subcats.length > 0) {
      setIdSubcategoria(subcats[0].id.toString());
    } else {
      setIdSubcategoria('');
    }
  };

  const refreshData = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
    const movs = await getAllMovimientos();
    setMovimientos(movs);
  };

  const handleSaveUrl = async () => {
    await AsyncStorage.setItem('serverUrl', url);
    Alert.alert("Éxito", "URL guardada exitosamente");
  };

  const handleTestConnection = async () => {
    if (!url) {
      Alert.alert("Error", "Primero debes configurar la URL");
      return;
    }
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'http://' + formattedUrl;
      }
      const baseUrl = formattedUrl.endsWith('/') ? formattedUrl : formattedUrl + '/';
      
      const res = await fetch(`${baseUrl}api/movimientos/health`);
      if (res.ok) {
        Alert.alert("Conectado", "¡Conexión exitosa con el servidor!");
      } else {
        Alert.alert("Error", "El servidor respondió con error");
      }
    } catch (error) {
      Alert.alert("Error de conexión", error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCatalogs();
    await refreshData();
    setRefreshing(false);
  };

  const handleAddMovimiento = async () => {
    if (!desc || !monto) {
      Alert.alert("Error", "Debes ingresar descripción y monto");
      return;
    }
    if (!idCategoria || !idMetodopago) {
      Alert.alert("Error", "Debes sincronizar al menos una vez para obtener catálogos");
      return;
    }
    
    const mov = {
      monto: parseFloat(monto),
      cantidad: 1,
      descripcion: desc,
      fecha: fecha.toISOString(),
      tipo: parseInt(tipo),
      id_categoria: parseInt(idCategoria),
      id_subcategoria: idSubcategoria ? parseInt(idSubcategoria) : null,
      id_metodopago: parseInt(idMetodopago)
    };
    
    try {
      await addMovimiento(mov);
      Alert.alert("Guardado", "Movimiento guardado offline");
      
      // Reset form
      setDesc('');
      setMonto('');
      setFecha(new Date());
      refreshData();
    } catch (error) {
      Alert.alert("Error de base de datos", error.message);
    }
  };

  const handleSync = async () => {
    if (!url) {
      Alert.alert("Error", "Primero debes configurar la URL del servidor");
      return;
    }
    setIsSyncing(true);
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'http://' + formattedUrl;
      }
      const baseUrl = formattedUrl.endsWith('/') ? formattedUrl : formattedUrl + '/';
      
      // 1. Enviar pendientes
      const pendingMovs = await getPendingMovimientos();
      if (pendingMovs.length > 0) {
        const dtos = pendingMovs.map(m => ({
          Id: m.id,
          Monto: m.monto,
          Cantidad: m.cantidad,
          Descripcion: m.descripcion,
          Fecha: m.fecha,
          Tipo: m.tipo,
          Id_Categoria: m.id_categoria,
          id_metodopago: m.id_metodopago,
          Id_subcategoria: m.id_subcategoria
        }));

        const response = await fetch(`${baseUrl}api/movimientos/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dtos)
        });

        if (response.ok) {
          await deleteAllPendingMovimientos();
        } else {
          Alert.alert("Error", "Falló el envío de movimientos pendientes");
        }
      }

      // 2. Descargar Catálogos
      const catRes = await fetch(`${baseUrl}api/categoria`);
      const subcatRes = await fetch(`${baseUrl}api/categoria/getsubcategorias`);
      let allCats = [];
      if (catRes.ok) {
        const cats = await catRes.json();
        allCats = [...allCats, ...cats];
      }
      if (subcatRes.ok) {
        const subcats = await subcatRes.json();
        allCats = [...allCats, ...subcats];
      }
      if (allCats.length > 0) {
        await saveCategorias(allCats);
      }

      const metRes = await fetch(`${baseUrl}api/metodospagos`);
      if (metRes.ok) {
        const mets = await metRes.json();
        await saveMetodosPago(mets);
      }

      // 3. Descargar Movimientos actuales
      const now = new Date();
      const movsRes = await fetch(`${baseUrl}api/movimientos/todoslosmovimientos?mes=${now.getMonth()+1}&anio=${now.getFullYear()}`);
      if (movsRes.ok) {
        const movs = await movsRes.json();
        await deleteAllServerMovimientos();
        for (const m of movs) {
          await addMovimiento({
            id_server: m.id !== undefined ? m.id : m.Id,
            monto: m.monto !== undefined ? m.monto : m.Monto,
            cantidad: m.cantidad !== undefined ? m.cantidad : m.Cantidad,
            descripcion: m.descripcion !== undefined ? m.descripcion : m.Descripcion,
            fecha: m.fecha !== undefined ? m.fecha : m.Fecha,
            tipo: m.tipo !== undefined ? m.tipo : m.Tipo,
            id_categoria: m.id_categoria !== undefined ? m.id_categoria : (m.id_Categoria !== undefined ? m.id_Categoria : m.Id_Categoria),
            id_subcategoria: m.id_subcategoria !== undefined ? m.id_subcategoria : m.Id_subcategoria,
            id_metodopago: m.id_metodopago !== undefined ? m.id_metodopago : m.Id_metodopago,
            isSyncPending: 0 // Marca que viene del servidor
          });
        }
      }

      Alert.alert("Éxito", "Sincronización completa");
      await loadCatalogs();
      await refreshData();
      
    } catch (error) {
      Alert.alert("Error de conexión", error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de movmientos offline</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, tab === 'form' && styles.tabActive]} onPress={() => setTab('form')}>
          <Text style={[styles.tabText, tab === 'form' && styles.tabTextActive]}>Formulario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'list' && styles.tabActive]} onPress={() => setTab('list')}>
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'settings' && styles.tabActive]} onPress={() => setTab('settings')}>
          <Text style={[styles.tabText, tab === 'settings' && styles.tabTextActive]}>Ajustes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {tab === 'settings' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.subtitle}>Ajustes de Servidor</Text>
              <TextInput 
                style={styles.input} 
                placeholder="http://192.168.1.X:8090/" 
                value={url}
                onChangeText={setUrl}
              />
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Button title="Guardar URL" onPress={handleSaveUrl} />
                <Button title="Probar Conexión" onPress={handleTestConnection} color="#757575" />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.subtitle}>Sincronización Total</Text>
              <Text style={{color: 'red', marginBottom: 10, fontWeight: 'bold'}}>
                Movimientos Locales sin subir: {pendingCount}
              </Text>
              <Text style={{color: 'gray', marginBottom: 10}}>
                Esto enviará tus datos locales y descargará los catálogos y el mes actual.
              </Text>
              {isSyncing ? (
                <ActivityIndicator size="large" color="green" />
              ) : (
                <Button title="Sincronizar Todo" color="green" onPress={handleSync} />
              )}
            </View>
          </View>
        )}

        {tab === 'form' && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Nuevo Movimiento</Text>
            
            <Text style={styles.label}>Descripción</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej. Supermercado" 
              value={desc}
              onChangeText={setDesc}
            />

            <Text style={styles.label}>Monto</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="numeric"
              value={monto}
              onChangeText={setMonto}
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15}}>
              <View style={{width: '48%', marginBottom: 10}}>
                <Button title="Egreso" color={tipo === '0' ? '#e53935' : '#ccc'} onPress={() => setTipo('0')} />
              </View>
              <View style={{width: '48%', marginBottom: 10}}>
                <Button title="Ingreso" color={tipo === '1' ? '#4caf50' : '#ccc'} onPress={() => setTipo('1')} />
              </View>
              <View style={{width: '48%'}}>
                <Button title="Egreso Virtual" color={tipo === '2' ? '#d32f2f' : '#ccc'} onPress={() => setTipo('2')} />
              </View>
              <View style={{width: '48%'}}>
                <Button title="Ingreso Virtual" color={tipo === '3' ? '#388e3c' : '#ccc'} onPress={() => setTipo('3')} />
              </View>
            </View>

            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Text>{fecha.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setFecha(selectedDate);
                }}
              />
            )}

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={idCategoria}
                onValueChange={(itemValue) => setIdCategoria(itemValue)}
              >
                <Picker.Item label="Selecciona..." value="" />
                {categorias.map(c => <Picker.Item key={c.id} label={c.nombre} value={c.id.toString()} />)}
              </Picker>
            </View>

            {subcategorias.length > 0 && (
              <>
                <Text style={styles.label}>Subcategoría</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={idSubcategoria}
                    onValueChange={(itemValue) => setIdSubcategoria(itemValue)}
                  >
                    <Picker.Item label="Ninguna" value="" />
                    {subcategorias.map(s => <Picker.Item key={s.id} label={s.nombre} value={s.id.toString()} />)}
                  </Picker>
                </View>
              </>
            )}

            <Text style={styles.label}>Método de Pago</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={idMetodopago}
                onValueChange={(itemValue) => setIdMetodopago(itemValue)}
              >
                <Picker.Item label="Selecciona..." value="" />
                {metodos.map(m => <Picker.Item key={m.id} label={m.metodo} value={m.id.toString()} />)}
              </Picker>
            </View>

            <Button title="Guardar Offline" onPress={handleAddMovimiento} color="#1976D2" />
          </View>
        )}

        {tab === 'list' && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Mes Actual (Local + Servidor)</Text>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee'}}>
              <View>
                <Text style={{color: 'gray', fontSize: 12}}>Total Ingresos</Text>
                <Text style={{color: 'green', fontWeight: 'bold', fontSize: 16}}>
                  ${movimientos.filter(m => m.tipo === 1 || m.tipo === 3).reduce((sum, m) => sum + parseFloat(m.monto), 0).toFixed(2)}
                </Text>
              </View>
              <View>
                <Text style={{color: 'gray', fontSize: 12}}>Total Egresos</Text>
                <Text style={{color: 'red', fontWeight: 'bold', fontSize: 16}}>
                  ${movimientos.filter(m => m.tipo === 0 || m.tipo === 2).reduce((sum, m) => sum + parseFloat(m.monto), 0).toFixed(2)}
                </Text>
              </View>
              <View>
                <Text style={{color: 'gray', fontSize: 12}}>Balance</Text>
                <Text style={{color: '#333', fontWeight: 'bold', fontSize: 16}}>
                  ${(
                    movimientos.filter(m => m.tipo === 1 || m.tipo === 3).reduce((sum, m) => sum + parseFloat(m.monto), 0) - 
                    movimientos.filter(m => m.tipo === 0 || m.tipo === 2).reduce((sum, m) => sum + parseFloat(m.monto), 0)
                  ).toFixed(2)}
                </Text>
              </View>
            </View>

            {movimientos.length === 0 && <Text style={{fontStyle: 'italic', color: 'gray'}}>No hay movimientos. Sincroniza o agrega uno.</Text>}
            {movimientos.map(m => {
              const isPending = m.isSyncPending === 1;
              const dateStr = new Date(m.fecha).toLocaleDateString();
              const isIngreso = m.tipo === 1 || m.tipo === 3;
              return (
                <TouchableOpacity key={m.id} style={[styles.listItem, isPending && styles.listItemPending]} onPress={() => { setSelectedMov(m); setModalVisible(true); }}>
                  <View style={{flex: 1}}>
                    <Text style={{fontWeight: 'bold'}}>{m.descripcion}</Text>
                    <Text style={{fontSize: 12, color: 'gray'}}>{dateStr}</Text>
                    {isPending && <Text style={{fontSize: 10, color: 'red'}}>PENDIENTE DE SUBIR</Text>}
                  </View>
                  <Text style={{fontWeight: 'bold', color: isIngreso ? 'green' : 'red'}}>
                    {isIngreso ? '+' : '-'}${m.monto}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>

      {selectedMov && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.subtitle}>Detalles del Movimiento</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Descripción:</Text>
                <Text style={styles.detailValue}>{selectedMov.descripcion}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto:</Text>
                <Text style={styles.detailValue}>${selectedMov.monto}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>{new Date(selectedMov.fecha).toLocaleDateString()} {new Date(selectedMov.fecha).toLocaleTimeString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={styles.detailValue}>
                  {selectedMov.tipo === 1 ? 'Ingreso' : selectedMov.tipo === 3 ? 'Ingreso Virtual' : selectedMov.tipo === 0 ? 'Egreso' : 'Egreso Virtual'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Categoría:</Text>
                <Text style={styles.detailValue}>
                  {categorias.find(c => c.id == selectedMov.id_categoria)?.nombre || selectedMov.id_categoria}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método Pago:</Text>
                <Text style={styles.detailValue}>
                  {metodos.find(m => m.id == selectedMov.id_metodopago)?.metodo || selectedMov.id_metodopago}
                </Text>
              </View>
              
              <View style={{marginTop: 15}}>
                <Button title="Cerrar" onPress={() => setModalVisible(false)} color="#1976D2" />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  tabActive: {
    backgroundColor: '#1976D2'
  },
  tabText: {
    fontWeight: 'bold',
    color: '#555'
  },
  tabTextActive: {
    color: 'white'
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fafafa'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fafafa'
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    alignItems: 'center'
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  listItemPending: {
    backgroundColor: '#ffebee'
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5
  },
  detailLabel: {
    fontWeight: 'bold',
    flex: 1,
    color: '#333'
  },
  detailValue: {
    flex: 2,
    color: '#666',
    textAlign: 'right'
  }
});
