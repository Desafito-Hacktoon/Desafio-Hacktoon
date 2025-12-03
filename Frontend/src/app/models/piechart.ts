export interface Piechart {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
}
