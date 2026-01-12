// import * as grpc from '@grpc/grpc-js';
// import * as protoLoader from '@grpc/proto-loader';
// import path from 'path';

// const PROTO_PATH = path.join(__dirname, '../../../../protos/auth.proto');
// const packageDefinition = protoLoader.loadSync(PROTO_PATH);
// const authProto = grpc.loadPackageDefinition(packageDefinition) as any;


// const client = new authProto.AuthService(
//     'localhost:50051', 
//     grpc.credentials.createInsecure()
// );


// export const verifyTokenGrpc = (token: string): Promise<any> => {
//     return new Promise((resolve, reject) => {
//         client.VerifyToken({ token }, (err: any, response: any) => {
//             if (err) {
//                 return reject(err); 
//             }
//             resolve(response);
//         });
//     });
// };