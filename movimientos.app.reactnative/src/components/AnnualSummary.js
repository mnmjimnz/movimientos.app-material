import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';

export default function AnnualSummary({ url, theme }) {
  const styles = getStyles(theme);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ confirmados: [], virtuales: [] });

  const fetchData = useCallback(async () => {
    if (!url) {
      // Don't fetch if url is empty
      return;
    }
    setLoading(true);
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'http://' + formattedUrl;
      }
      const baseUrl = formattedUrl.endsWith('/') ? formattedUrl : formattedUrl + '/';
      
      const res = await fetch(`${baseUrl}api/movimientos/movimientosvirtualesanuales?anio=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los datos del servidor.');
      }
    } catch (error) {
      Alert.alert('Error de red', 'No hay conexión con el servidor o la URL es incorrecta.');
    } finally {
      setLoading(false);
    }
  }, [url, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const Table = ({ title, items }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No hay movimientos para mostrar.</Text>
      ) : (
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, {flex: 1.5}]}>Mes</Text>
            <Text style={styles.headerCell}>Ingresos</Text>
            <Text style={styles.headerCell}>Egresos</Text>
            <Text style={styles.headerCell}>Saldo</Text>
          </View>
          {items.map((m, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.cell, {flex: 1.5, fontWeight: 'bold'}]}>{m.mes}</Text>
              <Text style={[styles.cell, {color: theme.success}]}>${m.ingresos_proyectados}</Text>
              <Text style={[styles.cell, {color: theme.danger}]}>${m.egresos_proyectados}</Text>
              <Text style={styles.cell}>${m.saldo_proyectado}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const processedVirtuales = React.useMemo(() => {
    if (!data.virtuales) return [];
    
    const fechaActual = new Date();
    const mesActualStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    
    let saldoAnterior = 0;
    
    return data.virtuales.map(mov => {
      let ingresos = parseFloat(mov.ingresos_proyectados);
      let egresos = parseFloat(mov.egresos_proyectados);
      let saldo = parseFloat(mov.saldo_proyectado);
      
      if (mov.mes > mesActualStr) {
        ingresos += saldoAnterior;
        saldo = ingresos - egresos;
      }
      
      saldoAnterior = saldo;
      
      return {
        ...mov,
        ingresos_proyectados: ingresos.toFixed(2),
        egresos_proyectados: egresos.toFixed(2),
        saldo_proyectado: saldo.toFixed(2)
      };
    });
  }, [data.virtuales]);

  const processedConfirmados = React.useMemo(() => {
    if (!data.confirmados) return [];
    return data.confirmados.map(mov => ({
      ...mov,
      ingresos_proyectados: parseFloat(mov.ingresos_proyectados).toFixed(2),
      egresos_proyectados: parseFloat(mov.egresos_proyectados).toFixed(2),
      saldo_proyectado: parseFloat(mov.saldo_proyectado).toFixed(2)
    }));
  }, [data.confirmados]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 30}}>
      
      <View style={styles.yearSelector}>
        <TouchableOpacity style={styles.btn} onPress={() => setYear(year - 1)}>
          <Text style={styles.btnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setYear(year + 1)}>
          <Text style={styles.btnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {!url ? (
        <Text style={styles.emptyText}>Configura la URL en Ajustes para ver este reporte.</Text>
      ) : loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 50}} />
      ) : (
        <>
          <Table title="Movimientos totales confirmados" items={processedConfirmados} />
          <Table title="Movimientos totales esperados" items={processedVirtuales} />
        </>
      )}

    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  yearText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginHorizontal: 30,
  },
  btn: {
    backgroundColor: theme.tabBackground,
    padding: 10,
    borderRadius: 5,
  },
  btnText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.card,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: theme.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: theme.text,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  }
});
