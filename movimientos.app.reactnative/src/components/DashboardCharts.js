import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false
};

const defaultColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#f93154', '#00b74a', '#39c0ed'];

const ChartSection = ({ title, data, isVirtual }) => {
  const { ingresosTotales, egresosTotales, catData, dailyFlow, paymentMethodData } = data;
  
  const flowData = [
    { name: 'Ingresos', population: ingresosTotales, color: '#00b74a', legendFontColor: '#333', legendFontSize: 14 },
    { name: 'Egresos', population: egresosTotales, color: '#f93154', legendFontColor: '#333', legendFontSize: 14 }
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
          chartConfig={chartConfig}
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
            chartConfig={chartConfig}
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
            ...chartConfig,
            color: (opacity = 1) => isVirtual ? `rgba(153, 102, 255, ${opacity})` : `rgba(57, 192, 237, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
            ...chartConfig,
            color: (opacity = 1) => `rgba(255, 169, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          style={styles.chartStyle}
        />
      </View>
    </View>
  );
};

export default function DashboardCharts({ movimientos, categorias, metodos }) {
  
  const calculateData = (isVirtual) => {
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
      legendFontColor: '#7F7F7F',
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
      realData: calculateData(false),
      virtualData: calculateData(true)
    };
  }, [movimientos, categorias, metodos]);

  return (
    <View style={styles.container}>
      <ChartSection title="Movimientos Reales" data={realData} isVirtual={false} />
      <View style={styles.divider} />
      <ChartSection title="Movimientos Virtuales" data={virtualData} isVirtual={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20
  },
  sectionContainer: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
    marginTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2',
    paddingBottom: 5,
    alignSelf: 'flex-start'
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20
  },
  card: {
    backgroundColor: 'white',
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
    color: '#333',
    alignSelf: 'flex-start'
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16
  }
});
