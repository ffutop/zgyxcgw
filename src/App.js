import React from "react";
import "./App.css";
import { Divider, Input, Layout, Table } from "antd";
import 'antd/dist/antd.css';

const { Header, Content } = Layout;
const { TextArea } = Input;

const orderTime2List = ["20201", "20202", "20203", "20204", ""];
const getSuppurDistributeRecentHost =
  "http://localhost:3000/proxy/suppurDistributeRecent/getSuppurDistributeRecent.html?optionType=0";
const tableHeaders = [
  { title: "invoiceId", dataIndex: "invoiceId", key: "invoiceId" },
  { title: "price", dataIndex: "price", key: "price" }
];

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      textValue: "",
      columns: tableHeaders,
      data: [{ invoiceId: "1111", price: 2020.33 }]
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleQuery = this.handleQuery.bind(this);
  }

  handleChange(event) {
    this.setState({ textValue: event.target.value });
  }

  handleQuery() {
    const invoiceIds = this.state.textValue.split("\n");
    invoiceIds.forEach(invoiceId => {
      orderTime2List.forEach(orderTime2 => {
        fetch(getSuppurDistributeRecentHost, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded"
          },
          body:
            "_search=false&nd=" +
            new Date().getTime() +
            "&rows=2000&page=1&sidx=&sord=asc&invoiceId=" +
            invoiceId +
            "&multiWords=&goodsIds=&purchaseType=&orderdetailState=&submitStartTime=&submitEndTime=&hospitalName=&distributeId=" +
            (orderTime2 === "" ? "" : "&orderTime2=" + orderTime2)
        })
          .then(response => response.json())
          .then(
            result => {
              if (result.rows.length !== 0) {
                var sum = 0;
                result.rows.forEach(row => {
                  sum += row.getPurchasePrice * row.getPurchaseCount;
                });
                this.setState((state, props) => {
                  var newData = state.data;
                  newData.push({
                    invoiceId: invoiceId,
                    price: sum
                  });
                  return {
                    data: newData
                  };
                });
              }
            },
            error => {
              this.setState({
                error
              });
            }
          );
      });
    });
  }

  render() {
    return (
      <div className="App">
        <Layout>
          <Header></Header>
          <Content>
            <TextArea
              placeholder="请输入发票号"
              rows={4}
              allowClear={true}
              onPressEnter={this.handleQuery}
              onChange={this.handleChange}
            />
            <Divider />
            <Table columns={this.state.columns} dataSource={this.state.data} pagination={false}/>
          </Content>
        </Layout>
      </div>
    );
  }
}
