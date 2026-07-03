import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDb, addMovimiento, getPendingCount, getPendingMovimientos, deleteAllPendingMovimientos } from './src/database';

export default function App() {
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('0'); // 0 Egreso, 1 Ingreso
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function setup() {
      await initDb();
      const savedUrl = await AsyncStorage.getItem('serverUrl');
      if (savedUrl) setUrl(savedUrl);
      refreshCount();
    }
    setup();
  }, []);

  const refreshCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  const handleSaveUrl = async () => {
    await AsyncStorage.setItem('serverUrl', url);
    Alert.alert("Éxito", "URL guardada exitosamente");
  };

  const handleAddMovimiento = async () => {
    if (!desc || !monto) {
      Alert.alert("Error", "Debes ingresar descripción y monto");
      return;
    }
    const mov = {
      monto: parseFloat(monto),
      cantidad: 1,
      descripcion: desc,
      fecha: new Date().toISOString(),
      tipo: parseInt(tipo),
      id_categoria: 1,
      id_metodopago: 1
    };
    await addMovimiento(mov);
    Alert.alert("Guardado", "Movimiento guardado offline");
    setDesc('');
    setMonto('');
    refreshCount();
  };

  const handleSync = async () => {
    if (!url) {
      Alert.alert("Error", "Primero debes configurar la URL del servidor");
      return;
    }
    setIsSyncing(true);
    try {
      const baseUrl = url.endsWith('/') ? url : url + '/';
      const pendingMovs = await getPendingMovimientos();
      
      if (pendingMovs.length > 0) {
        // Map local format to DTO format
        const dtos = pendingMovs.map(m => ({
          Id: m.id,
          Monto: m.monto,
          Cantidad: m.cantidad,
          Descripcion: m.descripcion,
          Fecha: m.fecha,
          Tipo: m.tipo,
          Id_Categoria: m.id_categoria,
          id_metodopago: m.id_metodopago
        }));

        const response = await fetch(`${baseUrl}api/movimientos/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dtos)
        });

        if (response.ok) {
          await deleteAllPendingMovimientos();
          Alert.alert("Éxito", "Datos sincronizados correctamente");
        } else {
          Alert.alert("Error", "Falló la sincronización con el servidor");
        }
      } else {
        Alert.alert("Info", "No hay nada que sincronizar");
      }
    } catch (error) {
      Alert.alert("Error de conexión", error.message);
    } finally {
      setIsSyncing(false);
      refreshCount();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modo Offline (React Native)</Text>
      
      <View style={styles.card}>
        <Text style={styles.subtitle}>Ajustes de Servidor</Text>
        <TextInput 
          style={styles.input} 
          placeholder="https://192.168.1.X:7001/" 
          value={url}
          onChangeText={setUrl}
        />
        <Button title="Guardar URL" onPress={handleSaveUrl} />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Sincronización</Text>
        <Text style={{color: 'red', marginBottom: 10, fontWeight: 'bold'}}>
          Movimientos Pendientes: {pendingCount}
        </Text>
        <Button 
          title={isSyncing ? "Sincronizando..." : "Sincronizar Ahora"} 
          color="green" 
          onPress={handleSync} 
          disabled={isSyncing}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Agregar Movimiento</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Descripción" 
          value={desc}
          onChangeText={setDesc}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Monto" 
          keyboardType="numeric"
          value={monto}
          onChangeText={setMonto}
        />
        <View style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15}}>
          <Button title="Egreso" color={tipo === '0' ? '#2196F3' : '#ccc'} onPress={() => setTipo('0')} />
          <Button title="Ingreso" color={tipo === '1' ? '#2196F3' : '#ccc'} onPress={() => setTipo('1')} />
        </View>
        <Button title="Guardar Offline" onPress={handleAddMovimiento} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
    flexGrow: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
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
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15
  }
});
