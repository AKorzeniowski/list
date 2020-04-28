import LinelistCaseRow, { Case } from "./LinelistCaseRow";

import React from "react";
import Table from 'react-bootstrap/Table';
import axios from 'axios';

interface TableState {
    errorMessage: string,
    isLoaded: boolean,
    linelist: Case[]
}

export default class LinelistTable extends React.Component<{}, TableState> {

    constructor(props: any) {
        super(props);
        this.state = {
            errorMessage: '',
            isLoaded: false,
            linelist: []
        };
    }

    async componentDidMount() {
        try {
            const response = await axios.get<Case[]>((process.env.REACT_APP_API_ENDPOINT || "") + '/api/cases');
            this.setState({
                isLoaded: true,
                linelist: response.data
            });
        } catch (e) {
            this.setState({
                isLoaded: true,
                errorMessage: e.message
            });
        }
    }

    render() {
        const { errorMessage, isLoaded, linelist } = this.state;
        if (errorMessage.length > 0) {
            return <div>Error: {errorMessage}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        }
        return (
            <Table bordered hover striped>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Outcome</th>
                    </tr>
                </thead>
                <tbody>
                    {linelist.map(item => (
                        <LinelistCaseRow
                            case={item}
                            key={item._id}
                        />
                    ))}
                </tbody>
            </Table>
        )
    }
}