import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import session from '../../lib/session';
import Head from '../../components/head';
import { getResultsByRunId } from '../../lib/api';
import Table from '@ux/table';
import Card from '@ux/card';
import Spinner from '@ux/spinner';
import { Module } from '@ux/layout';
import text from '@ux/text';



const ViewPage = ({ authDetails }) => {
    if (authDetails) session.setSessionItem('weblogin', authDetails.accountName);
    const [tableLoading, setTableLoading] = useState(true);
    const router = useRouter();
    const [data, setData] = useState();
    const [routeParams, setRouteParams] = useState({
        run_id: decodeURIComponent(router.query?.id?.[0] || '0')
    });

    // const model = [{
    //     llm_response: 'value here',
    //     prompt_template_text: 'something here',
    //     interaction_id: 'dafa',
    //     routing_report_region_2: 'value here',
    //     customer_type_name: 'value here',
    //     handled_repeat_contact_platform: 'value here',
    //     css_score: 'value here',
    //     nps_score: 'value here',
    //     run_id: 'value here',
    // }];
    const testModel = [
        {
            "Data": [
                {
                    "VarCharValue": "conversation_summary"
                },
                {
                    "VarCharValue": "prompt_template_text"
                },
                {
                    "VarCharValue": "interaction_id"
                },
                {
                    "VarCharValue": "routing_report_region_2"
                },
                {
                    "VarCharValue": "customer_type_name"
                },
                {
                    "VarCharValue": "handled_repeat_contact_platform"
                },
                {
                    "VarCharValue": "css_score"
                },
                {
                    "VarCharValue": "nps_score"
                },
                {
                    "VarCharValue": "run_id"
                }
            ]
        },
        {
            "Data": [
                {
                    "VarCharValue": " The customer received a message that their website services may be suspended due to a plugin potentially containing viruses or unauthorized content. After investigating the plugin, which is widely used for social media connections, the agent determined it was likely flagged in error as it contains standard scripting and does not appear to be malicious. The agent notified the appropriate team and assured the customer their site would not be suspended. The root cause seemed to be overzealous virus detection, and no preventative action was needed on the customer's part.\n\n\n 8"
                },
                {
                    "VarCharValue": "Give me a three sentence summary of below between call center guide and customer at GoDaddy.com. Focus on customer intent, root cause, and any recommended preventative options.\n[transcript]\n\n\non a scale of 1-10, output how accurate the following response is from a large language model, where the model is asked to give a three sentence summary of this interaction between call center guide and customer at GoDaddy.com, focusing on customer intent, root cause, and any recommended preventative options.\nHere is the transcript: [transcript]\nHere is the summary: [summary]"
                },
                {},
                {
                    "VarCharValue": "United States"
                },
                {
                    "VarCharValue": "US Independent"
                },
                {
                    "VarCharValue": "No Repeat Contact"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "d940b7ee-b3f5-4b70-a150-36a0d4d599e6"
                }
            ]
        },
        {
            "Data": [
                {
                    "VarCharValue": " Here is a three sentence summary:\n\nThe customer needed help installing an SSL certificate for a new patient portal subdomain but could not find the private key during installation. The root cause was that the private key is only available during initial certificate setup and not afterwards. The agent recommended the customer regenerate the certificate and signing request to get a new private key, which was then used successfully to re-key the certificate and complete the installation.\n\n\n 8/10. This response accurately captures the customer intent, root cause of the issue, and provides a recommendation. It could be more concise while still hitting the key points."
                },
                {
                    "VarCharValue": "Give me a three sentence summary of below between call center guide and customer at GoDaddy.com. Focus on customer intent, root cause, and any recommended preventative options.\n[transcript]\n\n\non a scale of 1-10, output how accurate the following response is from a large language model, where the model is asked to give a three sentence summary of this interaction between call center guide and customer at GoDaddy.com, focusing on customer intent, root cause, and any recommended preventative options.\nHere is the transcript: [transcript]\nHere is the summary: [summary]"
                },
                {},
                {
                    "VarCharValue": "United States"
                },
                {
                    "VarCharValue": "Partner"
                },
                {
                    "VarCharValue": "No Repeat Contact"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "d940b7ee-b3f5-4b70-a150-36a0d4d599e6"
                }
            ]
        },
        {
            "Data": [
                {
                    "VarCharValue": " Here is a three sentence summary of the call:\n\nThe customer was experiencing low traffic to their website since migrating hosting and wanted to understand the root cause and options. The agent determined the new IP addresses from the hosting change likely meant the site needed to be re-indexed by search engines. Updating the SSL certificate through GoDaddy's managed SSL program would submit a new site map to search engines for re-indexing, potentially preventing this issue in the future for the customer.\n\n\n 8"
                },
                {
                    "VarCharValue": "Give me a three sentence summary of below between call center guide and customer at GoDaddy.com. Focus on customer intent, root cause, and any recommended preventative options.\n[transcript]\n\n\non a scale of 1-10, output how accurate the following response is from a large language model, where the model is asked to give a three sentence summary of this interaction between call center guide and customer at GoDaddy.com, focusing on customer intent, root cause, and any recommended preventative options.\nHere is the transcript: [transcript]\nHere is the summary: [summary]"
                },
                {},
                {
                    "VarCharValue": "United States"
                },
                {
                    "VarCharValue": "US Independent"
                },
                {
                    "VarCharValue": "Inbound Voice"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "d940b7ee-b3f5-4b70-a150-36a0d4d599e6"
                }
            ]
        },
        {
            "Data": [
                {
                    "VarCharValue": " The customer called the GoDaddy call center to resolve a technical issue with their client's website. They were seeing unexpected IP addresses listed on the firewall settings page and wanted to understand what they represented and ensure the correct IP address was allowed. The agent explained that the additional IP addresses were related to Cloudflare CDN caching of website content for improved performance. They walked the customer through updating the allowed IP address and clearing the cache. The customer appreciated being able to speak with an agent directly to resolve the issue.\n\n\n 8/10. The summary accurately captures the customer intent, root cause of needing to update approved IP addresses, and recommendations provided by the agent related to firewall settings and cache clearing. It could be slightly more concise while still conveying the key details."
                },
                {
                    "VarCharValue": "Give me a three sentence summary of below between call center guide and customer at GoDaddy.com. Focus on customer intent, root cause, and any recommended preventative options.\n[transcript]\n\n\non a scale of 1-10, output how accurate the following response is from a large language model, where the model is asked to give a three sentence summary of this interaction between call center guide and customer at GoDaddy.com, focusing on customer intent, root cause, and any recommended preventative options.\nHere is the transcript: [transcript]\nHere is the summary: [summary]"
                },
                {},
                {
                    "VarCharValue": "United States"
                },
                {
                    "VarCharValue": "Partner"
                },
                {
                    "VarCharValue": "Inbound Voice"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "d940b7ee-b3f5-4b70-a150-36a0d4d599e6"
                }
            ]
        },
        {
            "Data": [
                {
                    "VarCharValue": " The customer called GoDaddy support with issues accessing their website. The agent discovered DNS records were pointing to incorrect IP addresses, likely due to the customer manually updating records previously. The agent worked with the customer to correctly update the DNS A record to resolve the issue. It may take time to propagate globally. The root cause was incorrect DNS configuration, and ensuring proper DNS setup can help prevent such issues.\n\n\n 8/10. The summary accurately captures the customer intent, identifies the root cause of the issue, and mentions the preventative solution implemented by changing the DNS records. It could be more concise but overall effectively summarizes the key details from the lengthy transcript."
                },
                {
                    "VarCharValue": "Give me a three sentence summary of below between call center guide and customer at GoDaddy.com. Focus on customer intent, root cause, and any recommended preventative options.\n[transcript]\n\n\non a scale of 1-10, output how accurate the following response is from a large language model, where the model is asked to give a three sentence summary of this interaction between call center guide and customer at GoDaddy.com, focusing on customer intent, root cause, and any recommended preventative options.\nHere is the transcript: [transcript]\nHere is the summary: [summary]"
                },
                {},
                {
                    "VarCharValue": "United States"
                },
                {
                    "VarCharValue": "Partner"
                },
                {
                    "VarCharValue": "No Repeat Contact"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "d940b7ee-b3f5-4b70-a150-36a0d4d599e6"
                }
            ]
        },
        {
            "Data": [
                {
                    "VarCharValue": " The customer's intent was to shut down and delete an unused website and domain for a client. The root cause was that the website and domain, readingthelandscape.org, was not performing as intended and they did not plan to use it further. To prevent this in the future, the customer and client should evaluate websites and domains more regularly to determine if they are still fulfilling their objectives or if it is better to deactivate them. The agent was able to park the domain, remove it from the website, and reset the hosting space, fulfilling the customer's request to cleanly shut down the site while keeping the hosting package available for future use.\n\n\n 8/10. This response accurately summarizes the customer's intent to shut down the readingthelandscape.org website and allow the domain to expire since it was no longer being used. It also correctly identifies the root cause of the website not living up to its potential. The recommendation about having a plan for each website's purpose and timeline is reasonable advice to prevent unused sites in the future. The summary captures the key details while being concise."
                },
                {
                    "VarCharValue": "Give me a three sentence summary of below between call center guide and customer at GoDaddy.com. Focus on customer intent, root cause, and any recommended preventative options.\n[transcript]\n\n\non a scale of 1-10, output how accurate the following response is from a large language model, where the model is asked to give a three sentence summary of this interaction between call center guide and customer at GoDaddy.com, focusing on customer intent, root cause, and any recommended preventative options.\nHere is the transcript: [transcript]\nHere is the summary: [summary]"
                },
                {},
                {
                    "VarCharValue": "United States"
                },
                {
                    "VarCharValue": "Partner"
                },
                {
                    "VarCharValue": "No Repeat Contact"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "10"
                },
                {
                    "VarCharValue": "d940b7ee-b3f5-4b70-a150-36a0d4d599e6"
                }
            ]
        }
    ]
    const columns = [{
        column_name: 'llm_response',
        column_dislay_name: 'LLM Response',
    }, {
        column_name: 'prompt_template_text',
        column_dislay_name: 'Prompt Template Text'
    }, {
        column_name: 'interaction_id',
        column_dislay_name: 'Interaction ID'
    }, {
        column_name: 'routing_report_region_2',
        column_dislay_name: 'Routing Report Region 2'
    }, {
        column_name: 'customer_type_name',
        column_dislay_name: 'Customer Type Name'
    }, {
        column_name: 'handled_repeat_contact_platform',
        column_dislay_name: 'Handled Repeat Contact Platform'
    }, {
        column_name: 'css_score',
        column_dislay_name: 'CSS Score'
    }, {
        column_name: 'nps_score',
        column_dislay_name: 'NPS Score'
    }, {
        column_name: 'run_id',
        column_dislay_name: 'Run ID'
    }];
    useEffect(() => {
        setTableLoading(true);
        setData(testModel);
        setTableLoading(false);
        testModel.forEach((item, dataIndex) => {
            console.log('item', item);
            console.log('dataIndex', dataIndex);
        });
        // getResultsByRunId(routeParams.run_id).then((data) => {
        //     console.log(data);
        //     setData(data);
        //     setTableLoading(false);
        // })

    }, []);

    return (
        <>
            <Head title='GoDaddy Lighthouse - View Summary' route='status' />
            <Card id='evaluation' className='m-t-1' stretch={true} title='Ev' space={{ inline: true, block: true, as: 'blocks' }}>
                <Module>
                    <Table className='table table-hover'>
                        <thead>
                            <tr>
                                {columns.map((column, index) => (
                                    <th key={index} column={column.column_name}>{column.column_dislay_name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!tableLoading && data?.map((item, dataIndex) => (
                                <tr key={`c-${dataIndex}`}>
                                    {columns.map((column, index) => (
                                        <td key={index} column={column.column_name}>{item.Data[index]?.VarCharValue}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <div className='lh-container lh-center'>
                        <div className='text-center'>
                            {data?.length === 0 && <text.p text='No records found' />}
                            {data?.length > 0 && <div>{data.length}</div>}
                            {tableLoading && <>
                                <Spinner />
                                <text.p text='Please be patient while we retrieve your results.' />
                            </>}
                        </div>
                    </div>
                </Module>
            </Card>
            {/* <Card stretch={true} id='results' title='Results'>
                <Module>
                    {tableLoading && <text.p text='Loading...' />}
                    {!tableLoading &&
                        <Table
                            className='table table-hover'
                            sortable={true}>
                            <thead>
                                <tr>
                                    {columnList.map((column, index) => (
                                        <th column={column} showIcon>{column}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {/* {results?.length == 0 && <tr><td colSpan='6'>No records found</td></tr>}
                                {results?.map((item, index) => (
                                    <tr key={item.run_id}>
                                        <td column='run_id'> {item.run_id}

                                        </td>
                                        <td column='run_date'>{item.run_date}</td>
                                        <td column='last_updated_time'>{item.last_updated_time}</td>
                                        <td column='user_id'>{item.user_id}</td>
                                        <td column='status'>{item.status}</td>
                                        <td column='action'>{item.action === 'cancel' ? CancelButton(item) : item.action == 'view' ? ViewButton(item) : null}</td>
                                    </tr>
                                )) || null} 
                            </tbody>
                        </Table>
                    }
                </Module>
            </Card> */}
        </>
    )
};
ViewPage.propTypes = {
    authDetails: PropTypes.object
};
export default ViewPage;