import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const getChartConfig = (theme) => ({
  backgroundGradientFrom: theme.chartBackground,
  backgroundGradientTo: theme.chartBackground,
  color: (opacity = 1) => theme.chartLineLabel.replace('opacity', opacity),
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false
});

const defaultColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#f93154', '#00b74a', '#39c0ed'];

const ChartSection = ({ title, data, isVirtual, theme }) => {
  const styles = getStyles(theme);
  const { ingresosTotales, egresosTotales, catData, dailyFlow, paymentMethodData } = data;
  
  const flowData = [
    { name: 'Ingresos', population: ingresosTotales, color: '#00b74a', legendFontColor: theme.chartLegendText, legendFontSize: 14 },
    { name: 'Egresos', population: egresosTotales, color: '#f93154', legendFontColor: theme.chartLegendText, legendFontSize: 14 }
  ];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      {/* Main Income vs Expense Pie */}
      <View style={styles.card}>
        <Text style={styles.title}>Distribución de Flujo</Text>
        <PieChart
          data={flowData}
          width={screenWidth - 70}
          height={200}
          chartConfig={getChartConfig(theme)}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"0"}
          absolute
        />
      </View>

      {/* Categories Pie */}
      {catData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.title}>Gastos por Categoría</Text>
          <PieChart
            data={catData}
            width={screenWidth - 70}
            height={200}
            chartConfig={getChartConfig(theme)}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"0"}
            absolute
          />
        </View>
      )}

      {/* Daily Cashflow Line */}
      <View style={styles.card}>
        <Text style={styles.title}>Flujo de Caja Diario</Text>
        <LineChart
          data={dailyFlow}
          width={screenWidth - 70}
          height={220}
          chartConfig={{
            ...getChartConfig(theme),
            color: (opacity = 1) => isVirtual ? `rgba(153, 102, 255, ${opacity})` : `rgba(57, 192, 237, ${opacity})`,
            labelColor: (opacity = 1) => theme.chartLineLabel.replace('opacity', opacity),
          }}
          bezier
          style={styles.chartStyle}
        />
      </View>

      {/* Payment Method Bar */}
      <View style={styles.card}>
        <Text style={styles.title}>Gastos por Método de Pago</Text>
        <BarChart
          data={paymentMethodData}
          width={screenWidth - 70}
          height={220}
          yAxisLabel="$"
          chartConfig={{
            ...getChartConfig(theme),
            color: (opacity = 1) => `rgba(255, 169, 0, ${opacity})`,
            labelColor: (opacity = 1) => theme.chartLineLabel.replace('opacity', opacity),
          }}
          style={styles.chartStyle}
        />
      </View>
    </View>
  );
};


const AnnualChartSection = ({ title, data, theme }) => {
  const styles = getStyles(theme);
  
  if (!data || data.length === 0) return null;

  const labels = data.map(m => m.mes.substring(5)); // just month
  const ingresos = data.map(m => parseFloat(m.ingresos_proyectados));
  const egresos = data.map(m => parseFloat(m.egresos_proyectados));

  const chartData = {
    labels: labels.length > 0 ? labels : ['N/A'],
    datasets: [
      {
        data: ingresos.length > 0 ? ingresos : [0],
        color: (opacity = 1) => `rgba(0, 183, 74, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: egresos.length > 0 ? egresos : [0],
        color: (opacity = 1) => `rgba(249, 49, 84, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Ingresos", "Egresos"]
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 70}
        height={250}
        chartConfig={{
          ...getChartConfig(theme),
          color: (opacity = 1) => theme.chartLineLabel.replace('opacity', opacity),
          labelColor: (opacity = 1) => theme.chartLineLabel.replace('opacity', opacity),
        }}
        bezier
        style={styles.chartStyle}
      />
    </View>
  );
};

export default function DashboardCharts({ movimientos, categorias, metodos, theme, url }) {
  const styles = getStyles(theme);
  
  
  const [annualData, setAnnualData] = useState(null);
  const [loadingAnnual, setLoadingAnnual] = useState(false);

  const fetchAnnualData = useCallback(async () => {
    if (!url) return;
    setLoadingAnnual(true);
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'http://' + formattedUrl;
      }
      const baseUrl = formattedUrl.endsWith('/') ? formattedUrl : formattedUrl + '/';
      const year = new Date().getFullYear();
      const res = await fetch(`${baseUrl}api/movimientos/movimientosvirtualesanuales?anio=${year}`);
      if (res.ok) {
        const json = await res.json();
        setAnnualData(json);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAnnual(false);
    }
  }, [url]);

  useEffect(() => {
    fetchAnnualData();
  }, [fetchAnnualData]);

  const { processedConfirmados, processedVirtuales } = useMemo(() => {
    if (!annualData) return { processedConfirmados: [], processedVirtuales: [] };

    const fechaActual = new Date();
    const mesActualStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    let saldoAnterior = 0;

    const vData = (annualData.virtuales || []).map(mov => {
      let ingresos = parseFloat(mov.ingresos_proyectados);
      let egresos = parseFloat(mov.egresos_proyectados);
      let saldo = parseFloat(mov.saldo_proyectado);
      
      if (mov.mes > mesActualStr) {
        ingresos += saldoAnterior;
        saldo = ingresos - egresos;
      }
      saldoAnterior = saldo;
      return { ...mov, ingresos_proyectados: ingresos, egresos_proyectados: egresos };
    });

    return {
      processedConfirmados: annualData.confirmados || [],
      processedVirtuales: vData
    };
  }, [annualData]);

  const calculateData = (isVirtual, theme) => {
    let ingresos = 0;
    let egresos = 0;
    const catMap = {};
    const methodMap = {};
    const dailyMap = {}; // Day -> Balance

    const filteredMovs = movimientos.filter(m => {
      if (isVirtual) {
        return m.tipo === 2 || m.tipo === 3;
      } else {
        return m.tipo === 0 || m.tipo === 1;
      }
    });

    let currentBalance = 0;
    
    // Sort ascending for daily flow
    const sortedMovs = [...filteredMovs].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    sortedMovs.forEach((m) => {
      const isIngreso = (m.tipo === 1 || m.tipo === 3);
      const isEgreso = (m.tipo === 0 || m.tipo === 2);
      const amount = parseFloat(m.monto);
      
      if (isIngreso) ingresos += amount;
      if (isEgreso) egresos += amount;

      // Group by Category (Only Egresos)
      if (isEgreso) {
        const catName = categorias.find(c => c.id == m.id_categoria)?.nombre || 'Sin categoría';
        catMap[catName] = (catMap[catName] || 0) + amount;
      }

      // Group by Payment Method (Only Egresos)
      if (isEgreso) {
        const metName = metodos.find(met => met.id == m.id_metodopago)?.metodo || 'Desconocido';
        methodMap[metName] = (methodMap[metName] || 0) + amount;
      }

      // Daily flow
      const day = new Date(m.fecha).getDate().toString();
      if (isIngreso) currentBalance += amount;
      if (isEgreso) currentBalance -= amount;
      dailyMap[day] = currentBalance;
    });

    // Formatting for Charts
    const catDataArr = Object.keys(catMap).map((key, index) => ({
      name: key,
      population: Math.round(catMap[key] * 100) / 100,
      color: defaultColors[index % defaultColors.length],
      legendFontColor: theme.chartLegendText,
      legendFontSize: 12
    }));

    // Daily Flow labels and data
    const days = Object.keys(dailyMap).sort((a, b) => parseInt(a) - parseInt(b));
    const dailyFlowData = {
      labels: days.length > 0 ? days : ['1'],
      datasets: [
        {
          data: days.length > 0 ? days.map(d => Math.round(dailyMap[d] * 100) / 100) : [0]
        }
      ]
    };

    // Payment Methods Bar Chart
    const methodData = {
      labels: Object.keys(methodMap).length > 0 ? Object.keys(methodMap).map(k => k.substring(0, 5)) : ['N/A'],
      datasets: [
        {
          data: Object.keys(methodMap).length > 0 ? Object.values(methodMap).map(v => Math.round(v * 100) / 100) : [0]
        }
      ]
    };

    return {
      ingresosTotales: Math.round(ingresos * 100) / 100,
      egresosTotales: Math.round(egresos * 100) / 100,
      catData: catDataArr,
      dailyFlow: dailyFlowData,
      paymentMethodData: methodData
    };
  };

  const { realData, virtualData } = useMemo(() => {
    return {
      realData: calculateData(false, theme),
      virtualData: calculateData(true, theme)
    };
  }, [movimientos, categorias, metodos]);

  return (
    <View style={styles.container}>
      <ChartSection title="Movimientos Reales" data={realData} isVirtual={false} theme={theme} />
      
      {loadingAnnual ? (
        <ActivityIndicator size="large" color={theme.primary} style={{marginVertical: 20}} />
      ) : (
        <>
          <AnnualChartSection title="Histórico Anual (Ingresos vs Egresos Reales)" data={processedConfirmados} theme={theme} />
        </>
      )}

      <View style={styles.divider} />
      <ChartSection title="Movimientos Virtuales" data={virtualData} isVirtual={true} theme={theme} />
      
      {!loadingAnnual && (
        <AnnualChartSection title="Histórico Anual Virtual (Ingresos vs Egresos)" data={processedVirtuales} theme={theme} />
      )}
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    paddingBottom: 20
  },
  sectionContainer: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 15,
    marginTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
    paddingBottom: 5,
    alignSelf: 'flex-start'
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 20
  },
  card: {
    backgroundColor: theme.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.text,
    alignSelf: 'flex-start'
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16
  }
});
