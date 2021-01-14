import React from "react";
import "./App.css";
import { Col, Divider, Input, Layout, Row, Table, Switch } from "antd";
import "antd/dist/antd.css";
import { docCookies } from "./cookie.js";

const { Header, Content } = Layout;
const { TextArea } = Input;

const orderTime2List = ["20201", "20202", "20203", "20204", ""];
const host = "http://invoice.ffutop.com";
const getSuppurDistributeRecentLink =
  host +
  "/proxy/suppurDistributeRecent/getSuppurDistributeRecent.html?optionType=0";
const getPayDataLink = host + "/proxy/payCalendar/getPayData.html";
const defaultTableHeaders = [
  { title: "invoiceId", dataIndex: "invoiceId", key: "invoiceId" },
  { title: "price", dataIndex: "price", key: "price" }
];

const withPayTableHeaders = [
  { title: "invoiceId", dataIndex: "invoiceId", key: "invoiceId" },
  { title: "price", dataIndex: "price", key: "price" },
  { title: "paid", dataIndex: "paid", key: "paid" }
];

const buildForm = function(invoiceId, orderTime2) {
  var form =
    "_search=false&nd=" +
    new Date().getTime() +
    "&rows=2000&page=1&sidx=&sord=asc&invoiceId=" +
    invoiceId +
    "&multiWords=&goodsIds=&purchaseType=&orderdetailState=&submitStartTime=&submitEndTime=&hospitalName=&distributeId=" +
    (orderTime2 === "" ? "" : "&orderTime2=" + orderTime2);
  return form;
};

const buildPayForm = function(invoiceId, orderTime2, rows) {
  var form =
    "_search=false&nd=" +
    new Date().getTime() +
    "&rows=" +
    rows +
    "&page=1&sidx=&sord=asc&orderTime2=" +
    orderTime2 +
    "&goodsId=&invoiceId=" +
    invoiceId +
    "&storageDateStartTime=&storageDateEndTime=&hospitalName=&payOrderCode=&storageTags=&payStatus2=";
  return form;
};

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cookie: "",
      textValue: "",
      withPay: false,
      columns: defaultTableHeaders,
      data: []
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleTextAreaChange = this.handleTextAreaChange.bind(this);
    this.handleSwitchChange = this.handleSwitchChange.bind(this);
    this.getSuppurDistributeRecent = this.getSuppurDistributeRecent.bind(this);
    this.getPayData = this.getPayData.bind(this);
    this.setCookie = this.setCookie.bind(this);
  }

  setCookie() {
    docCookies.setItem("hcloginToken", this.state.cookie);
  }

  handleInputChange(event) {
    this.setState({ cookie: event.target.value });
  }

  handleTextAreaChange(event) {
    this.setState({
      textValue: event.target.value,
      data: []
    });
  }

  handleSwitchChange(checked) {
    this.setState(state => {
      if (checked === true) {
        return {
          withPay: checked,
          columns: withPayTableHeaders
        };
      } else {
        return {
          withPay: checked,
          columns: defaultTableHeaders
        };
      }
    });
    this.setState({ withPay: checked });
  }

  getSuppurDistributeRecent() {
    const invoiceIds = this.state.textValue.split("\n");
    invoiceIds.forEach(invoiceId => {
      invoiceId = invoiceId.trim();
      if (invoiceId !== "") {
        orderTime2List.forEach(orderTime2 => {
          fetch(getSuppurDistributeRecentLink, {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded"
            },
            body: buildForm(invoiceId, orderTime2)
          })
            .then(response => response.json())
            .then(
              result => {
                if (result.rows.length !== 0) {
                  var sum = 0;
                  result.rows.forEach(row => {
                    sum += row.purchaseCount * row.purchasePrice;
                  });
                  this.setState(state => {
                    var newData = state.data.concat({
                      invoiceId: invoiceId,
                      price: sum
                    });
                    return {
                      data: newData
                    };
                  });
                }
                this.getPayData(invoiceId, orderTime2, result.rows.length);
              },
              error => {
                this.setState({
                  error
                });
              }
            );
        });
      }
    });
  }

  getPayData(invoiceId, orderTime2, rows) {
    if (this.state.withPay === false) {
      return;
    }
    fetch(getPayDataLink, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: buildPayForm(invoiceId, orderTime2, rows)
    })
      .then(response => response.json())
      .then(
        result => {
          if (result.rows.length !== 0) {
            var sum = 0;
            result.rows.forEach(row => {
              if (row.payStatus === 9) {
                sum += row.realAmount;
              }
            });
            this.setState((state, props) => {
              var newData = [...state.data];
              newData.forEach(item => {
                if (item.invoiceId === invoiceId) {
                  item.paid = sum;
                }
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
  }

  render() {
    return (
      <div className="App">
        <Layout>
          <Header></Header>
          <Content>
            <Row>
              <Col span={20}>
                <Input
                  placeholder="请输入账号登录后的 Cookie"
                  onChange={this.handleInputChange}
                  onPressEnter={this.setCookie}
                />
              </Col>
              <Col span={4}>
                <Switch
                  checkedChildren="已开启支付检测"
                  unCheckedChildren="已关闭支付检测"
                  onChange={this.handleSwitchChange}
                />
              </Col>
            </Row>
            <TextArea
              placeholder="请输入发票号"
              rows={4}
              allowClear={true}
              onPressEnter={this.getSuppurDistributeRecent}
              onChange={this.handleTextAreaChange}
            />
            <Divider />
            <Table
              columns={this.state.columns}
              dataSource={this.state.data}
              rowKey={record => record.invoiceId}
              pagination={false}
            />
          </Content>
        </Layout>
      </div>
    );
  }
}
